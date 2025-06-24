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
    if (!result) {
      this.logger.info(`No document/position result for definition request`);
      return Promise.resolve(null);
    }
    const [document, tokenPosition] = result;

    const symbol = await this.resolveSymbol(document, tokenPosition);
    if (!symbol) {
      this.logger.info(`No symbol resolved for definition request at ${params.position.line}:${params.position.character}`);
      return null;
    }

    if (!this.hasDeclaration(symbol)) {
      this.logger.info(`Symbol has no declaration for definition request: ${symbol.name}`);
      return null;
    }

    const location = this.getLocationFromDeclaration(symbol);
    if (!location) {
      this.logger.info(`Could not get location from declaration for symbol: ${symbol.name}`);
      return null;
    }

    this.logger.info(`Returning definition location for symbol ${symbol.name}: line ${location.range.start.line}, char ${location.range.start.character}-${location.range.end.character}`);
    return location;
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
      this.logger.info(`Symbol ${symbol.name} is not a supported type for definition`);
      return undefined;
    }

    this.logger.info(`Getting location from declaration for symbol: ${symbol.name}, context type: ${symbol.context?.constructor.name}`);

    // Find the identifier terminal node in the context
    let parseTree = symbol.context;
    
    if (symbol.context && symbol.context instanceof ParserRuleContext) {
      const identifier = this.findIdentifierInContext(symbol.context);
      if (identifier) {
        this.logger.info(`Found identifier node in context for symbol: ${symbol.name}`);
        parseTree = identifier;
      } else {
        this.logger.info(`No identifier node found in context for symbol: ${symbol.name}, falling back to original context`);
      }
    }
    
    if (!parseTree) {
      this.logger.info(`No parse tree available for symbol: ${symbol.name}`);
      return undefined;
    }

    const definitionRange = RangeUtils.getRangeFromParseTree(parseTree);
    if (!definitionRange) {
      this.logger.info(`Could not get range from parse tree for symbol: ${symbol.name}`);
      return undefined;
    }

    this.logger.info(`Definition range for symbol ${symbol.name}: line ${definitionRange.start.line}, char ${definitionRange.start.character}-${definitionRange.end.character}`);

    return {
      uri: symbol.document.uri,
      range: definitionRange,
    };
  }

  private findIdentifierInContext(context: ParserRuleContext): TerminalNode | null {
    if (!context) {
      this.logger.info(`findIdentifierInContext: null context`);
      return null;
    }

    this.logger.info(`findIdentifierInContext: context type ${context.constructor.name}, children count: ${context.children?.length || 0}`);

    // For contexts that have an IDENTIFIER() method (like TaskDefinitionContext, DataDefinitionContext)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (context as any).IDENTIFIER === 'function') {
      this.logger.info(`findIdentifierInContext: context has IDENTIFIER() method`);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const identifier = (context as any).IDENTIFIER();
        if (identifier) {
          this.logger.info(`findIdentifierInContext: found identifier via IDENTIFIER() method, text: ${identifier.getText()}`);
          return identifier;
        } else {
          this.logger.info(`findIdentifierInContext: IDENTIFIER() method returned null/undefined`);
        }
      } catch (error) {
        this.logger.info(`findIdentifierInContext: error calling IDENTIFIER() method: ${error}`);
      }
    } else {
      this.logger.info(`findIdentifierInContext: context does not have IDENTIFIER() method`);
    }

    // For other contexts, try to find the identifier by traversing children
    if (context.children) {
      this.logger.info(`findIdentifierInContext: traversing ${context.children.length} children`);
      for (let i = 0; i < context.children.length; i++) {
        const child = context.children[i];
        this.logger.info(`findIdentifierInContext: child ${i} type: ${child?.constructor.name}, text: "${child?.getText() || 'N/A'}"`);
        
        // Look for terminal nodes that are identifiers
        if (child instanceof TerminalNode) {
          this.logger.info(`findIdentifierInContext: terminal node token type: ${child.symbol.type}, text: "${child.getText()}", XXP.IDENTIFIER: ${XXPParser.IDENTIFIER}, ESPACE.IDENTIFIER: ${ESPACEParser.IDENTIFIER}`);
          // Check if it's an IDENTIFIER token for either XXP or ESPACE
          if (child.symbol.type === XXPParser.IDENTIFIER || child.symbol.type === ESPACEParser.IDENTIFIER) {
            this.logger.info(`findIdentifierInContext: found IDENTIFIER terminal node with text: "${child.getText()}"`);
            return child;
          } else {
            this.logger.info(`findIdentifierInContext: terminal node is not an IDENTIFIER (type: ${child.symbol.type})`);
          }
        } else {
          this.logger.info(`findIdentifierInContext: child ${i} is not a TerminalNode`);
        }
      }
    } else {
      this.logger.info(`findIdentifierInContext: context has no children`);
    }

    this.logger.info(`findIdentifierInContext: no identifier found in context`);
    return null;
  }
}
