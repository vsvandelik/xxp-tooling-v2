import {
  XxpDataDefinitionContext,
  XxpTaskDefinitionContext,
  XxpWorkflowHeaderContext,
  EspaceSpaceHeaderContext,
  EspaceExperimentHeaderContext,
} from '@extremexp/core';
import { BaseSymbol } from 'antlr4-c3';
import { RenameParams, WorkspaceEdit, TextEdit, PrepareRenameParams, Range } from 'vscode-languageserver';

import { ExperimentSymbol } from '../core/models/symbols/ExperimentSymbol.js';
import { SpaceSymbol } from '../core/models/symbols/SpaceSymbol.js';
import { TerminalSymbolWithReferences } from '../core/models/symbols/TerminalSymbolWithReferences.js';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { TerminalSymbolReference } from '../core/models/TerminalSymbolReference.js';
import { Logger } from '../utils/Logger.js';
import { RangeUtils } from '../utils/RangeUtils.js';

import { Provider } from './Provider.js';

type RuleWithIdentifiers =
  | XxpDataDefinitionContext
  | XxpTaskDefinitionContext
  | XxpWorkflowHeaderContext
  | EspaceSpaceHeaderContext
  | EspaceExperimentHeaderContext;

export class RenamerProvider extends Provider {
  private logger = Logger.getLogger();

  addHandlers(): void {
    this.connection!.onPrepareRename(params => this.onPrepareRename(params));
    this.connection!.onRenameRequest(params => this.onRenameRequest(params));
  }

  private async onPrepareRename(params: PrepareRenameParams): Promise<Range | null> {
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
  }

  private isValidIdentifier(name: string): boolean {
    // Basic identifier validation - adjust according to your language rules
    if (!name || name.trim() !== name) return false;

    // Check if it starts with letter or underscore and contains only alphanumeric characters and underscores
    const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return identifierRegex.test(name);
  }
}
