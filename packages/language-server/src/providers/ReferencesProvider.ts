import { BaseSymbol } from 'antlr4-c3';
import { TerminalNode } from 'antlr4ng';
import { ReferenceParams, Location, Range, DefinitionParams } from 'vscode-languageserver';

import { ExperimentSymbol } from '../core/models/symbols/ExperimentSymbol.js';
import { SpaceSymbol } from '../core/models/symbols/SpaceSymbol.js';
import { TerminalSymbolWithReferences } from '../core/models/symbols/TerminalSymbolWithReferences.js';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { TerminalSymbolReference } from '../core/models/TerminalSymbolReference.js';
import { Logger } from '../utils/Logger.js';
import { RangeUtils } from '../utils/RangeUtils.js';

import { Provider } from './Provider.js';

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

    const symbol = document.symbolTable!.resolveSymbol(
      document,
      tokenPosition.parseTree,
      tokenPosition.text
    );
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
    if (!result) {
      return Promise.resolve(null);
    }
    const [document, tokenPosition] = result;

    const symbol = document.symbolTable!.resolveSymbol(
      document,
      tokenPosition.parseTree,
      tokenPosition.text
    );
    if (!symbol) {
      return null;
    }

    if (!this.hasDeclaration(symbol)) {
      return null;
    }

    const location = this.getLocationFromDeclaration(symbol);
    return location;
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
    return references.map(ref => {
      const line = ref.node.symbol.line - 1;
      const column = ref.node.symbol.column;
      const text = ref.node.getText();
      const endColumn = column + text.length;

      return {
        uri: ref.document.uri,
        range: Range.create(line, column, line, endColumn),
      };
    });
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

    // Find the identifier node using context-specific approach
    const identifierNode: TerminalNode | null = this.getIdentifierFromContext(
      parseTree,
      symbol.name
    );

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

    if (!definitionRange) {
      return undefined;
    }

    const result = {
      uri: symbol.document.uri,
      range: definitionRange,
    };
    return result;
  }

  private getIdentifierFromContext(parseTree: any, symbolName: string): TerminalNode | null {
    const contextName = parseTree.constructor.name;

    // Context-specific identifier resolution based on grammar structure
    switch (contextName) {
      case 'WorkflowHeaderContext':
        // workflowHeader: WORKFLOW IDENTIFIER (FROM workflowNameRead)?
        // IDENTIFIER is at position 1
        return this.getIdentifierAtPosition(parseTree, 1, symbolName);

      case 'WorkflowDeclarationContext':
        // WorkflowDeclarationContext contains WorkflowHeaderContext as first child
        if (parseTree.getChildCount() > 0) {
          const workflowHeaderChild = parseTree.getChild(0);
          if (workflowHeaderChild?.constructor?.name === 'WorkflowHeaderContext') {
            // WorkflowHeaderContext: WORKFLOW IDENTIFIER (FROM workflowNameRead)?
            return this.getIdentifierAtPosition(workflowHeaderChild, 1, symbolName);
          }
        }
        return this.getIdentifierGeneric(parseTree, symbolName);

      case 'TaskDefinitionContext':
        // taskDefinition: DEFINE TASK IDENTIFIER SEMICOLON
        // IDENTIFIER is at position 2
        return this.getIdentifierAtPosition(parseTree, 2, symbolName);

      case 'DataDefinitionContext':
        // dataDefinition: DEFINE DATA IDENTIFIER (EQUALS STRING)? SEMICOLON
        // IDENTIFIER is at position 2
        return this.getIdentifierAtPosition(parseTree, 2, symbolName);

      case 'ExperimentHeaderContext':
        // experimentHeader: EXPERIMENT IDENTIFIER
        // IDENTIFIER is at position 1
        return this.getIdentifierAtPosition(parseTree, 1, symbolName);

      case 'ExperimentDeclarationContext':
        // ExperimentDeclarationContext contains ExperimentHeaderContext as first child
        if (parseTree.getChildCount() > 0) {
          const experimentHeaderChild = parseTree.getChild(0);
          if (experimentHeaderChild?.constructor?.name === 'ExperimentHeaderContext') {
            // ExperimentHeaderContext: EXPERIMENT IDENTIFIER
            return this.getIdentifierAtPosition(experimentHeaderChild, 1, symbolName);
          }
        }
        return this.getIdentifierGeneric(parseTree, symbolName);

      case 'SpaceHeaderContext':
        // spaceHeader: SPACE IDENTIFIER OF workflowNameRead
        // IDENTIFIER is at position 1
        return this.getIdentifierAtPosition(parseTree, 1, symbolName);

      case 'ParamDefinitionContext':
        // paramDefinition: PARAM IDENTIFIER EQUALS paramValue SEMICOLON
        // IDENTIFIER is at position 1
        return this.getIdentifierAtPosition(parseTree, 1, symbolName);

      case 'ParamAssignmentContext':
        // paramAssignment: PARAM IDENTIFIER (EQUALS expression)? SEMICOLON
        // IDENTIFIER is at position 1
        return this.getIdentifierAtPosition(parseTree, 1, symbolName);

      default:
        // Fallback to generic search for unknown contexts
        return this.getIdentifierGeneric(parseTree, symbolName);
    }
  }

  private getIdentifierAtPosition(
    parseTree: any,
    position: number,
    symbolName: string
  ): TerminalNode | null {
    if (position >= parseTree.getChildCount()) {
      return null;
    }

    const child = parseTree.getChild(position);
    const isTerminalNode =
      child?.constructor?.name === 'TerminalNode' || child instanceof TerminalNode;
    const textMatches = child?.getText() === symbolName;

    if (isTerminalNode && textMatches) {
      return child as TerminalNode;
    }

    return null;
  }

  private getIdentifierGeneric(parseTree: any, symbolName: string): TerminalNode | null {
    // Fallback generic search (original implementation)
    for (let i = 0; i < parseTree.getChildCount(); i++) {
      const child = parseTree.getChild(i);

      const isTerminalNode =
        child?.constructor?.name === 'TerminalNode' || child instanceof TerminalNode;
      const textMatches = child?.getText() === symbolName;

      if (isTerminalNode && textMatches) {
        return child as TerminalNode;
      }
    }

    return null;
  }
}
