import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { CompletionParams, CompletionItem, CompletionItemKind } from 'vscode-languageserver';
import { BaseSymbol, CodeCompletionCore, ICandidateRule, SymbolTable, TokenList } from 'antlr4-c3';
import { Document } from '../core/documents/Document.js';
import { DataSymbol } from '../core/models/symbols/DataSymbol.js';
import { TaskSymbol } from '../core/models/symbols/TaskSymbol.js';
import { SpaceSymbol } from '../core/models/symbols/SpaceSymbol.js';
import { ParamSymbol } from '../core/models/symbols/ParamSymbol.js';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { TokenPosition } from '../core/models/TokenPosition.js';
import { DocumentSymbolTable } from '../language/symbolTable/DocumentSymbolTable.js';
import { CommonTokenStream, Vocabulary } from 'antlr4ng';
import { ESPACEParser } from '@extremexp/core';
import { SpaceScopeSymbol } from '../core/models/symbols/SpaceScopeSymbol.js';
import { ExperimentSymbol } from '../core/models/symbols/ExperimentSymbol.js';

export class EspaceSuggestionsProvider extends Provider {
  private logger = Logger.getLogger();

  private static readonly ignoredTokens = new Set([
    ESPACEParser.NUMBER,
    ESPACEParser.COMMENT,
    ESPACEParser.STRING,
  ]);

  private static readonly preferredRules = new Set([
    ESPACEParser.RULE_workflowNameRead,
    ESPACEParser.RULE_taskNameRead,
    ESPACEParser.RULE_spaceNameRead,
  ]);

  private static readonly visualSymbolsMap = new Map<number, string>([
    [ESPACEParser.SEMICOLON, ';'],
    [ESPACEParser.ARROW, '->'],
    [ESPACEParser.CONDITION_ARROW, '-?>'],
    [ESPACEParser.LBRACE, '{'],
    [ESPACEParser.RBRACE, '}'],
    [ESPACEParser.LPAREN, '('],
    [ESPACEParser.RPAREN, ')'],
    [ESPACEParser.EQUALS, '='],
    [ESPACEParser.COMMA, ','],
  ]);

  addHandlers(): void { }

  public async onCompletion(params: CompletionParams): Promise<CompletionItem[] | null> {
    this.logger.info(`Received completion request for document: ${params.textDocument.uri}`);

    const result = super.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return null;
    const [document, tokenPosition] = result;

    this.ensureCodeCompletionCoreInitialized(document);
    const candidates = document.codeCompletionCore!.collectCandidates(tokenPosition.index);

    const symbols: CompletionItem[] = [];

    // Use folder symbol table for cross-document symbol resolution
    const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(params.textDocument.uri);
    if (!folderSymbolTable) {
      this.logger.warn(`No folder symbol table found for ${params.textDocument.uri}`);
      return null;
    }
    
    symbols.push(
      ...(await this.processRules(
        candidates.rules,
        tokenPosition,
        folderSymbolTable,
        document.uri
      ))
    );
    symbols.push(...this.processTokens(candidates.tokens, document.parser!.vocabulary));

    return symbols;
  }

  private ensureCodeCompletionCoreInitialized(document: Document): void {
    if (document.codeCompletionCore) return;

    const parser = document.parser;

    const core = new CodeCompletionCore(parser!);
    core.ignoredTokens = EspaceSuggestionsProvider.ignoredTokens;
    core.preferredRules = EspaceSuggestionsProvider.preferredRules;

    document.codeCompletionCore = core;
  }

  private async processRules(
    rules: Map<number, ICandidateRule>,
    position: TokenPosition,
    symbolTable: DocumentSymbolTable,
    documentUri: string
  ): Promise<CompletionItem[]> {
    const proposedSymbols: CompletionItem[] = [];


    if (rules.has(ESPACEParser.RULE_workflowNameRead)) {
      // For workflows, we need to suggest available workflow files
      await this.suggestWorkflowFiles(proposedSymbols, documentUri);
    }

    if (rules.has(ESPACEParser.RULE_taskNameRead)) {
      // For tasks, suggest from the referenced workflow
      await this.suggestTasksFromReferencedWorkflow(position, proposedSymbols, symbolTable, documentUri);
    }

    if (rules.has(ESPACEParser.RULE_spaceNameRead)) {
      await this.suggestAndStoreSymbols(
        position,
        SpaceSymbol,
        proposedSymbols,
        symbolTable,
        documentUri,
        CompletionItemKind.Module
      );
    }


    return proposedSymbols;
  }

  private processTokens(tokens: Map<number, TokenList>, vocabulary: Vocabulary): CompletionItem[] {
    const proposedSymbols: CompletionItem[] = [];

    tokens.forEach((_, k) => {
      if (EspaceSuggestionsProvider.visualSymbolsMap.has(k)) {
        proposedSymbols.push({
          label: EspaceSuggestionsProvider.visualSymbolsMap.get(k) || '',
          kind: CompletionItemKind.Operator,
        });
      } else if (k !== ESPACEParser.IDENTIFIER) {
        const symbolicName = vocabulary.getSymbolicName(k);
        if (symbolicName === 'START' || symbolicName === 'END') {
          proposedSymbols.push({
            label: symbolicName,
            kind: CompletionItemKind.Keyword,
          });
        } else if (k === ESPACEParser.BOOLEAN) {
          // For BOOLEAN token, suggest the literal values instead of the keyword
          proposedSymbols.push({
            label: 'true',
            kind: CompletionItemKind.Value,
          });
          proposedSymbols.push({
            label: 'false',
            kind: CompletionItemKind.Value,
          });
        } else if (symbolicName) {
          proposedSymbols.push({
            label: symbolicName.toLowerCase(),
            kind: CompletionItemKind.Keyword,
          });
        }
      }
    });

    return proposedSymbols;
  }


  private async suggestAndStoreSymbols<T extends BaseSymbol>(
    position: TokenPosition,
    type: new (...args: any[]) => T,
    proposedSymbols: CompletionItem[],
    symbolTable: DocumentSymbolTable,
    documentUri: string,
    kind: CompletionItemKind
  ): Promise<void> {
    (await symbolTable.getValidSymbolsAtPosition(position.parseTree, documentUri, type)).forEach(s => {
      proposedSymbols.push({
        label: s,
        kind,
      });
    });
  }

  private async suggestWorkflowFiles(
    proposedSymbols: CompletionItem[],
    documentUri: string
  ): Promise<void> {
    // Get the folder symbol table for the current document
    const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(documentUri);

    if (folderSymbolTable) {
      // Get all workflows that have been parsed in this folder
      const workflows = await folderSymbolTable.getSymbolsOfType(WorkflowSymbol);

      // Create a set to avoid duplicates
      const addedWorkflows = new Set<string>();

      workflows.forEach(workflow => {
        if (!addedWorkflows.has(workflow.name)) {
          addedWorkflows.add(workflow.name);
          proposedSymbols.push({
            label: workflow.name,
            kind: CompletionItemKind.Class,
            detail: `Workflow defined in ${workflow.document.uri.split('/').pop()}`,
          });
        }
      });
    }
  }

  private async suggestTasksFromReferencedWorkflow(
    position: TokenPosition,
    proposedSymbols: CompletionItem[],
    symbolTable: DocumentSymbolTable,
    documentUri: string
  ): Promise<void> {
    const spaceScopeSymbol = await symbolTable.getCurrentScopeSymbolByType(position.parseTree, documentUri, SpaceScopeSymbol);
    if (!spaceScopeSymbol || !spaceScopeSymbol.symbolReference || !(spaceScopeSymbol.symbolReference instanceof SpaceSymbol)) {
      this.logger.warn('No SpaceScopeSymbol found at the current position');
      return;
    }
    const space = spaceScopeSymbol.symbolReference as SpaceSymbol;

    if (space.workflowReference) {
      const tasks = await space.workflowReference.getSymbolsOfType(TaskSymbol);
      tasks.forEach(task => {
        proposedSymbols.push({
          label: task.name,
          kind: CompletionItemKind.Variable,
          detail: `Task from ${space.workflowReference!.name}`,
        });
      });
    }
  }
}
