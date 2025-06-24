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
  EspaceDataDefinitionContext,
  EspaceParamDefinitionContext,
} from '@extremexp/core';
import { BaseSymbol } from 'antlr4-c3';
import { TerminalNode } from 'antlr4ng';

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
    const result = super.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return Promise.resolve(null);
    const [document, tokenPosition] = result;

    const symbol = await this.resolveSymbol(document, tokenPosition);
    if (!symbol || !this.hasDeclaration(symbol)) return null;

    return this.getLocationFromDeclaration(symbol);
  }

  private async resolveSymbol(document: any, tokenPosition: any): Promise<BaseSymbol | null> {
    // Handle workflow references
    if (
      tokenPosition.parseTree instanceof XxpWorkflowNameReadContext ||
      tokenPosition.parseTree instanceof EspaceWorkflowNameReadContext
    ) {
      // For workflows, we need to look in the folder symbol table
      const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(document.uri);
      const result = (await folderSymbolTable?.resolve(tokenPosition.text, false)) || null;
      return result;
    }

    // Handle space references in ESPACE files
    if (tokenPosition.parseTree instanceof EspaceSpaceNameReadContext) {
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        const result = (await experimentSymbol.resolve(tokenPosition.text, false)) || null;
        return result;
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

    // Handle data definitions in ESPACE files
    if (tokenPosition.parseTree instanceof EspaceDataDefinitionContext) {
      // Look for data symbols in the current document's symbol table
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        const result = (await experimentSymbol.resolve(tokenPosition.text, false)) || null;
        return result;
      }
    }

    // Handle param definitions in ESPACE files
    if (tokenPosition.parseTree instanceof EspaceParamDefinitionContext) {
      // For param definitions, resolve directly from the document's symbol table
      // which will search through all scopes including space scopes
      if (document.symbolTable) {
        const result = (await document.symbolTable.resolve(tokenPosition.text, true)) || null;
        return result;
      }
    }

    // Default resolution for other symbols
    if (document.workflowSymbolTable) {
      const result = (await document.workflowSymbolTable.resolve(tokenPosition.text, false)) || null;
      return result;
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
    if (!symbol) {
      return false;
    }

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

    const parseTree = symbol.context;
    if (!parseTree) {
      return undefined;
    }

    // Find the identifier node within the declaration context
    let identifierNode: TerminalNode | null = null;
    
    // Search through all children to find the matching identifier
    for (let i = 0; i < parseTree.getChildCount(); i++) {
      const child = parseTree.getChild(i);
      
      // Check by constructor name and instanceof to handle different TerminalNode types
      const isTerminalNode = child?.constructor?.name === 'TerminalNode' || child instanceof TerminalNode;
      const textMatches = child?.getText() === symbol.name;
      
      if (isTerminalNode && textMatches) {
        identifierNode = child as TerminalNode;
        break;
      }
    }
    
    if (!identifierNode) {
      return undefined;
    }

    // Try RangeUtils first, fallback to manual range creation
    let definitionRange = RangeUtils.getRangeFromParseTree(identifierNode);
    
    if (!definitionRange && identifierNode.symbol) {
      definitionRange = Range.create(
        identifierNode.symbol.line - 1,
        identifierNode.symbol.column,
        identifierNode.symbol.line - 1,
        identifierNode.symbol.column + identifierNode.getText().length
      );
    }
    
    if (!definitionRange) return undefined;

    return {
      uri: symbol.document.uri,
      range: definitionRange,
    };
  }
}
