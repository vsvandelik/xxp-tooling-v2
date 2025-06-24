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
    this.logger.info(`getLocationFromDeclaration: starting for symbol: ${symbol.name}`);
    
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
    this.logger.info(`Symbol context exists: ${!!symbol.context}, symbol document: ${symbol.document?.uri}`);

    // Find the identifier terminal node in the context
    let parseTree = symbol.context;
    
    if (symbol.context && symbol.context instanceof ParserRuleContext) {
      this.logger.info(`Attempting to find identifier in context for symbol: ${symbol.name}`);
      this.logger.info(`Original context details: start=${symbol.context.start ? `line ${symbol.context.start.line}, col ${symbol.context.start.column}` : 'null'}, stop=${symbol.context.stop ? `line ${symbol.context.stop.line}, col ${symbol.context.stop.column}` : 'null'}, text="${symbol.context.getText()}"`);
      
      try {
        const identifier = this.findIdentifierInContext(symbol.context);
        if (identifier) {
          this.logger.info(`Found identifier node in context for symbol: ${symbol.name}, identifier text: "${identifier.getText()}", line: ${identifier.symbol?.line}, col: ${identifier.symbol?.column}`);
          parseTree = identifier;
        } else {
          this.logger.info(`No identifier node found in context for symbol: ${symbol.name}, falling back to original context`);
        }
      } catch (error) {
        this.logger.info(`Error in findIdentifierInContext for symbol ${symbol.name}: ${error}`);
        this.logger.info(`Error stack trace: ${error instanceof Error ? error.stack : 'No stack trace'}`);
        this.logger.info(`Falling back to original context`);
      }
    } else {
      this.logger.info(`Symbol context is not a ParserRuleContext or is null for symbol: ${symbol.name}`);
    }
    
    if (!parseTree) {
      this.logger.info(`No parse tree available for symbol: ${symbol.name}`);
      return undefined;
    }

    this.logger.info(`Calling RangeUtils.getRangeFromParseTree with parseTree type: ${parseTree.constructor.name}`);
    
    // Add additional debugging for TerminalNode case
    if (parseTree instanceof TerminalNode) {
      this.logger.info(`TerminalNode details: symbol exists: ${!!parseTree.symbol}, text: "${parseTree.getText()}", symbol.line: ${parseTree.symbol?.line}, symbol.column: ${parseTree.symbol?.column}, symbol.type: ${parseTree.symbol?.type}`);
      this.logger.info(`TerminalNode symbol details: text="${parseTree.symbol?.text}", tokenIndex=${parseTree.symbol?.tokenIndex}`);
    } else if (parseTree instanceof ParserRuleContext) {
      this.logger.info(`ParserRuleContext details: start exists: ${!!parseTree.start}, stop exists: ${!!parseTree.stop}, text: "${parseTree.getText()}"`);
      if (parseTree.start) {
        this.logger.info(`Start token details: line=${parseTree.start.line}, column=${parseTree.start.column}, text="${parseTree.start.text}", type=${parseTree.start.type}`);
      }
      if (parseTree.stop) {
        this.logger.info(`Stop token details: line=${parseTree.stop.line}, column=${parseTree.stop.column}, text="${parseTree.stop.text}", type=${parseTree.stop.type}`);
      }
    }
    
    try {
      this.logger.info(`About to call RangeUtils.getRangeFromParseTree...`);
      const definitionRange = RangeUtils.getRangeFromParseTree(parseTree);
      if (!definitionRange) {
        this.logger.info(`Could not get range from parse tree for symbol: ${symbol.name} - RangeUtils returned null/undefined`);
        return undefined;
      }

      this.logger.info(`Definition range for symbol ${symbol.name}: line ${definitionRange.start.line}, char ${definitionRange.start.character}-${definitionRange.end.character}`);

      return {
        uri: symbol.document.uri,
        range: definitionRange,
      };
    } catch (error) {
      this.logger.info(`Exception in RangeUtils.getRangeFromParseTree for symbol ${symbol.name}: ${error}`);
      this.logger.info(`Exception details: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.logger.info(`Exception stack trace: ${error instanceof Error ? error.stack : 'No stack trace'}`);
      return undefined;
    }
  }

  private findIdentifierInContext(context: ParserRuleContext): TerminalNode | null {
    this.logger.info(`findIdentifierInContext: starting with context: ${context ? context.constructor.name : 'null'}`);
    
    if (!context) {
      this.logger.info(`findIdentifierInContext: null context`);
      return null;
    }

    try {
      this.logger.info(`findIdentifierInContext: context type ${context.constructor.name}, children count: ${context.children?.length || 0}`);
      this.logger.info(`findIdentifierInContext: context start: ${context.start ? `line ${context.start.line}, col ${context.start.column}, text "${context.start.text}"` : 'null'}`);
      this.logger.info(`findIdentifierInContext: context stop: ${context.stop ? `line ${context.stop.line}, col ${context.stop.column}, text "${context.stop.text}"` : 'null'}`);
      this.logger.info(`findIdentifierInContext: context text: "${context.getText()}"`);

      // For contexts that have an IDENTIFIER() method (like TaskDefinitionContext, DataDefinitionContext)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (context as any).IDENTIFIER === 'function') {
        this.logger.info(`findIdentifierInContext: context has IDENTIFIER() method`);
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const identifier = (context as any).IDENTIFIER();
          if (identifier) {
            this.logger.info(`findIdentifierInContext: found identifier via IDENTIFIER() method, text: "${identifier.getText()}", symbol type: ${identifier.symbol?.type}, line: ${identifier.symbol?.line}, col: ${identifier.symbol?.column}`);
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
            this.logger.info(`findIdentifierInContext: terminal node token type: ${child.symbol.type}, text: "${child.getText()}", line: ${child.symbol.line}, col: ${child.symbol.column}, XXP.IDENTIFIER: ${XXPParser.IDENTIFIER}, ESPACE.IDENTIFIER: ${ESPACEParser.IDENTIFIER}`);
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
    } catch (error) {
      this.logger.info(`findIdentifierInContext: caught exception: ${error}`);
      this.logger.info(`findIdentifierInContext: exception stack trace: ${error instanceof Error ? error.stack : 'No stack trace'}`);
      return null;
    }
  }
}
