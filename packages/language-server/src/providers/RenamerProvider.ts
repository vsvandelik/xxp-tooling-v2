import {
  XxpDataDefinitionContext,
  XxpTaskDefinitionContext,
  XxpWorkflowHeaderContext,
  EspaceSpaceHeaderContext,
  EspaceExperimentHeaderContext,
} from '@extremexp/core';
import { BaseSymbol } from 'antlr4-c3';
import { RenameParams, WorkspaceEdit, TextEdit, PrepareRenameParams, Location, Range,  } from 'vscode-languageserver';

import { ExperimentSymbol } from '../core/models/symbols/ExperimentSymbol.js';
import { SpaceSymbol } from '../core/models/symbols/SpaceSymbol.js';
import { TerminalSymbolWithReferences } from '../core/models/symbols/TerminalSymbolWithReferences.js';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { TerminalSymbolReference } from '../core/models/TerminalSymbolReference.js';
import { Logger } from '../utils/Logger.js';
import { RangeUtils } from '../utils/RangeUtils.js';

import { Provider } from './Provider.js';
import { TerminalNode } from 'antlr4ng';

type RuleWithIdentifiers =
  | XxpDataDefinitionContext
  | XxpTaskDefinitionContext
  | XxpWorkflowHeaderContext
  | EspaceSpaceHeaderContext
  | EspaceExperimentHeaderContext;

export class RenamerProvider extends Provider {
  private logger = Logger.getLogger();

  addHandlers(): void {
    //this.connection!.onPrepareRename(params => this.onPrepareRename(params));
    this.connection!.onRenameRequest(params => this.onRenameRequest(params));
  }

  private async onRenameRequest(params: RenameParams): Promise<WorkspaceEdit | null> {
    this.logger.info(`Received rename request for document: ${params.textDocument.uri}`);

    // Validate the new name
    if (!this.isValidIdentifier(params.newName)) {
      this.logger.warn(`Invalid identifier for rename: ${params.newName}`);
      return null;
    }

    const result = super.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return Promise.resolve(null);
    const [document, tokenPosition] = result;

    const symbol = document.symbolTable!.resolveSymbol(
      document,
      tokenPosition.parseTree,
      tokenPosition.text
    );
    if (!symbol) return null;

    // Don't allow renaming built-in tasks
    if (symbol.name === 'START' || symbol.name === 'END') {
      this.logger.warn(`Cannot rename built-in task: ${symbol.name}`);
      return null;
    }

    const locations = await this.getAllReferences(symbol);

    const definitionLocation = this.getLocationFromDeclaration(symbol);
    if (definitionLocation) locations.push(definitionLocation);

    const changes: { [uri: string]: TextEdit[] } = {};

    for (const location of locations) {
      const uri = location.uri;
      const range = location.range;

      if (!changes[uri]) {
        changes[uri] = [];
      }
      changes[uri].push(TextEdit.replace(range, params.newName));
    }

    return changes;
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

  /*private async onPrepareRename(params: PrepareRenameParams): Promise<Range | null> {
    this.logger.info(`Received prepare rename request for document: ${params.textDocument.uri}`);

    const result = super.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return null;
    const [document, tokenPosition] = result;

    const symbol = await this.resolveSymbol(document, tokenPosition);
    if (!symbol) return null;

    // Don't allow renaming built-in tasks
    if (symbol.name === 'START' || symbol.name === 'END') {
      this.logger.warn(`Cannot rename built-in task: ${symbol.name}`);
      return null;
    }

    // Return the range of the current symbol
    const range = RangeUtils.getRangeFromParseTree(tokenPosition.terminalNode || tokenPosition.parseTree);
    return range ?? null;
  }

  private async onRenameRequest(params: RenameParams): Promise<WorkspaceEdit | null> {
    this.logger.info(
      `Received rename request for document: ${params.textDocument.uri}, new name: ${params.newName}`
    );

    const result = super.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return null;
    const [document, tokenPosition] = result;

    // Validate the new name
    if (!this.isValidIdentifier(params.newName)) {
      this.logger.warn(`Invalid identifier for rename: ${params.newName}`);
      return null;
    }

    const symbol = await this.resolveSymbol(document, tokenPosition);
    if (!symbol) return null;

    // Don't allow renaming built-in tasks
    if (symbol.name === 'START' || symbol.name === 'END') {
      this.logger.warn(`Cannot rename built-in task: ${symbol.name}`);
      return null;
    }

    const references = await this.getAllReferencesForRename(symbol);
    const changes: { [uri: string]: TextEdit[] } = {};

    for (const reference of references) {
      const refDocument = reference.document;
      const uri = refDocument.uri;
      const range = RangeUtils.getRangeFromParseTree(reference.node);
      if (!range) continue;

      if (!changes[uri]) {
        changes[uri] = [];
      }
      changes[uri].push(TextEdit.replace(range, params.newName));
    }

    return { changes };
  }

  private async resolveSymbol(document: any, tokenPosition: any): Promise<BaseSymbol | null> {
    if (document.symbolTable === undefined) return null;

    // Use the same symbol resolution as ReferencesProvider
    const symbol = document.symbolTable!.resolveSymbol(
      document,
      tokenPosition.parseTree,
      tokenPosition.text
    );
    
    return symbol || null;
  }

  private async getAllReferencesForRename(symbol: BaseSymbol): Promise<TerminalSymbolReference[]> {
    const references: TerminalSymbolReference[] = [];

    // Add all references from the symbol (same as ReferencesProvider)
    if (
      symbol instanceof TerminalSymbolWithReferences ||
      symbol instanceof WorkflowSymbol ||
      symbol instanceof ExperimentSymbol
    ) {
      references.push(...symbol.references);

      // Add the definition itself for rename
      if (symbol.context) {
        const context = symbol.context as RuleWithIdentifiers;
        const identifier = context.IDENTIFIER?.();
        if (identifier) {
          references.push(new TerminalSymbolReference(identifier, symbol.document));
        }
      }
    }

    // For workflow symbols, also check in ESPACE files (same as ReferencesProvider)
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

    return references;
  }*/

  private isValidIdentifier(name: string): boolean {
    // Basic identifier validation - adjust according to your language rules
    if (!name || name.trim() !== name) return false;

    // Check if it starts with letter or underscore and contains only alphanumeric characters and underscores
    const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return identifierRegex.test(name);
  }
}
