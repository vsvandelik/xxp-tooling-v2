import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { ReferenceParams, Location, Range, DefinitionParams } from 'vscode-languageserver';
import { TerminalSymbolWithReferences } from '../core/models/symbols/TerminalSymbolWithReferences.js';
import { RangeUtils } from '../utils/RangeUtils.js';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { ExperimentSymbol } from '../core/models/symbols/ExperimentSymbol.js';
import { TerminalSymbolReference } from '../core/models/TerminalSymbolReference.js';
import { SpaceSymbol } from '../core/models/symbols/SpaceSymbol.js';
import {
  XxpWorkflowNameReadContext,
  EspaceWorkflowNameReadContext,
  EspaceTaskNameReadContext,
  EspaceSpaceNameReadContext,
  XXPParser,
  ESPACEParser,
} from '@extremexp/core';
import { BaseSymbol } from 'antlr4-c3';
import { TerminalNode, ParserRuleContext } from 'antlr4ng';
import { Document } from '../core/documents/Document.js';
import { TokenPosition } from '../core/models/TokenPosition.js';

export class ReferencesProvider extends Provider {
  private logger = Logger.getLogger();

  addHandlers(): void {
    this.connection!.onReferences(referenceParams => this.onReferences(referenceParams));
    this.connection!.onDefinition(tokenPosition => this.onDefinition(tokenPosition));
  }

  private async onReferences(params: ReferenceParams): Promise<Location[] | null> {
    this.logger.info(`Received references request for document: ${params.textDocument.uri}`);

    const result = super.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return Promise.resolve(null);
    const [document, tokenPosition] = result;

    const symbol = await this.resolveSymbol(document, tokenPosition);
    if (!symbol) return null;

    const locations = await this.getAllReferences(symbol);

    if (params.context.includeDeclaration && this.hasDeclaration(symbol)) {
      const definitionLocation = this.getLocationFromDeclaration(symbol);
      if (definitionLocation) locations.push(definitionLocation);
    }

    return locations;
  }

  public async onDefinition(params: DefinitionParams): Promise<Location | null | undefined> {
    this.logger.info(`Received definition request for document: ${params.textDocument.uri}`);

    const result = super.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return Promise.resolve(null);
    const [document, tokenPosition] = result;

    const symbol = await this.resolveSymbol(document, tokenPosition);
    if (!symbol || !this.hasDeclaration(symbol)) return null;

    return this.getLocationFromDeclaration(symbol);
  }

  private async resolveSymbol(document: Document, tokenPosition: TokenPosition): Promise<BaseSymbol | null> {
    // Handle workflow references
    if (
      tokenPosition.parseTree instanceof XxpWorkflowNameReadContext ||
      tokenPosition.parseTree instanceof EspaceWorkflowNameReadContext
    ) {
      // For workflows, we need to look in the folder symbol table
      const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(document.uri);
      return (await folderSymbolTable?.resolve(tokenPosition.text, false)) || null;
    }

    // Handle space references in ESPACE files
    if (tokenPosition.parseTree instanceof EspaceSpaceNameReadContext) {
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        return (await experimentSymbol.resolve(tokenPosition.text, false)) || null;
      }
    }

    // Handle task references in ESPACE files
    if (tokenPosition.parseTree instanceof EspaceTaskNameReadContext) {
      // First try local resolution
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        const localSymbol = await experimentSymbol.resolve(tokenPosition.text, true);
        if (localSymbol) return localSymbol;

        // If not found locally, search in referenced workflows
        const spaces = await experimentSymbol.getSymbolsOfType(SpaceSymbol);
        for (const space of spaces) {
          if (space.workflowReference) {
            const workflowSymbol = await space.workflowReference.resolve(tokenPosition.text, false);
            if (workflowSymbol) return workflowSymbol;
          }
        }
      }
    }

    // Default resolution for other symbols
    if (document.workflowSymbolTable) {
      return (await document.workflowSymbolTable.resolve(tokenPosition.text, false)) || null;
    }

    return null;
  }

  private async getAllReferences(symbol: BaseSymbol): Promise<Location[]> {
    const references: TerminalSymbolReference[] = [];

    if (
      symbol instanceof TerminalSymbolWithReferences ||
      symbol instanceof WorkflowSymbol ||
      symbol instanceof ExperimentSymbol
    ) {
      references.push(...symbol.references);
    }

    // For workflow symbols, also check in ESPACE files
    if (symbol instanceof WorkflowSymbol) {
      const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(
        symbol.document.uri
      );
      if (folderSymbolTable) {
        // Find all experiment symbols that might reference this workflow
        const experiments = await folderSymbolTable.getSymbolsOfType(ExperimentSymbol);
        for (const experiment of experiments) {
          const spaces = await experiment.getSymbolsOfType(SpaceSymbol);
          for (const space of spaces) {
            if (space.workflowReference?.name === symbol.name) {
              references.push(...space.workflowReference.references);
            }
          }
        }
      }
    }

    return this.getLocationsFromReferences(references);
  }

  private hasDeclaration(symbol: BaseSymbol): boolean {
    if (
      symbol instanceof TerminalSymbolWithReferences ||
      symbol instanceof WorkflowSymbol ||
      symbol instanceof ExperimentSymbol
    ) {
      return symbol.context !== undefined;
    }
    return false;
  }

  private getLocationsFromReferences(references: TerminalSymbolReference[]): Location[] {
    return references.map(ref => ({
      uri: ref.document.uri,
      range: Range.create(
        ref.node.symbol.line - 1,
        ref.node.symbol.column,
        ref.node.symbol.line - 1,
        ref.node.symbol.column + ref.node.getText().length
      ),
    }));
  }

  private getLocationFromDeclaration(symbol: BaseSymbol): Location | undefined {
    if (
      !(
        symbol instanceof TerminalSymbolWithReferences ||
        symbol instanceof WorkflowSymbol ||
        symbol instanceof ExperimentSymbol
      )
    ) {
      return undefined;
    }

    const parseTree = this.findIdentifierInContext(symbol.context) || symbol.context?.getChild(0) || symbol.context;
    if (!parseTree) return undefined;

    const definitionRange = RangeUtils.getRangeFromParseTree(parseTree);
    if (!definitionRange) return undefined;

    return {
      uri: symbol.document.uri,
      range: definitionRange,
    };
  }

  private findIdentifierInContext(context: any): TerminalNode | null {
    if (!context) return null;

    // For contexts that have an IDENTIFIER() method (like TaskDefinitionContext, DataDefinitionContext)
    if (typeof context.IDENTIFIER === 'function') {
      const identifier = context.IDENTIFIER();
      if (identifier) return identifier;
    }

    // For other contexts, try to find the identifier by traversing children
    if (context.children) {
      for (const child of context.children) {
        // Look for terminal nodes that are identifiers
        if (child instanceof TerminalNode) {
          // Check if it's an IDENTIFIER token for either XXP or ESPACE
          if (child.symbol.type === XXPParser.IDENTIFIER || child.symbol.type === ESPACEParser.IDENTIFIER) {
            return child;
          }
        }
      }
    }

    return null;
  }
}
