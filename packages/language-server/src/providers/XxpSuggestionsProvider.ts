import { XXPParser } from '@extremexp/core';
import { BaseSymbol, CodeCompletionCore, ICandidateRule, TokenList } from 'antlr4-c3';
import { CommonTokenStream, ParseTree, Vocabulary } from 'antlr4ng';
import { CompletionParams, CompletionItem, CompletionItemKind } from 'vscode-languageserver';

import { Document } from '../core/documents/Document.js';
import { DocumentManager } from '../core/managers/DocumentsManager.js';
import { DataSymbol } from '../core/models/symbols/DataSymbol.js';
import { TaskSymbol } from '../core/models/symbols/TaskSymbol.js';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { TokenPosition } from '../core/models/TokenPosition.js';
import { DocumentSymbolTable } from '../language/symbolTable/DocumentSymbolTable.js';
import { Logger } from '../utils/Logger.js';

import { Provider } from './Provider.js';

export class XxpSuggestionsProvider extends Provider {
  private logger = Logger.getLogger();

  private static readonly ignoredTokens = new Set([
    XXPParser.NUMBER,
    XXPParser.COMMENT,
    XXPParser.STRING,
  ]);
  private static readonly preferredRules = new Set([
    XXPParser.RULE_workflowNameRead,
    XXPParser.RULE_dataNameRead,
    XXPParser.RULE_taskNameRead,
  ]);
  private static readonly visualSymbolsMap = new Map<number, string>([
    [XXPParser.SEMICOLON, ';'],
    [XXPParser.ARROW, '->'],
    [XXPParser.LBRACE, '{'],
    [XXPParser.RBRACE, '}'],
    [XXPParser.EQUALS, '='],
  ]);

  addHandlers(): void {}

  public async onCompletion(params: CompletionParams): Promise<CompletionItem[] | null> {
    this.logger.info(`Received completion request for document: ${params.textDocument.uri}`);

    const result = super.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return null;
    const [document, tokenPosition] = result;

    this.ensureCodeCompletionCoreInitialized(document);
    const candidates = document.codeCompletionCore!.collectCandidates(tokenPosition.index);

    const symbols: CompletionItem[] = [];

    // Use folder symbol table for cross-document symbol resolution
    const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(
      params.textDocument.uri
    );
    if (!folderSymbolTable) {
      this.logger.warn(`No folder symbol table found for ${params.textDocument.uri}`);
      return null;
    }

    await this.fixTokensSuggestionForChains(
      candidates.tokens,
      tokenPosition,
      document.tokenStream!,
      folderSymbolTable,
      document.uri
    );
    // Special handling for workflow inheritance: check if we're after "from" keyword in workflow header
    const inheritanceCompletions = await this.getWorkflowInheritanceCompletions(
      tokenPosition,
      document.tokenStream!,
      folderSymbolTable,
      document.uri
    );
    if (inheritanceCompletions.length > 0) {
      // If we found inheritance completions, return only those (don't mix with other suggestions)
      return inheritanceCompletions;
    }

    symbols.push(
      ...(await this.processRules(candidates.rules, tokenPosition, folderSymbolTable, document))
    );
    symbols.push(
      ...this.processTokens(
        candidates.tokens,
        document.parser!.vocabulary,
        tokenPosition,
        document.tokenStream
      )
    );

    return symbols;
  }

  private ensureCodeCompletionCoreInitialized(document: Document): void {
    if (document.codeCompletionCore) return;

    const parser = document.parser;

    const core = new CodeCompletionCore(parser!);
    core.ignoredTokens = XxpSuggestionsProvider.ignoredTokens;
    core.preferredRules = XxpSuggestionsProvider.preferredRules;

    document.codeCompletionCore = core;
  }

  private async processRules(
    rules: Map<number, ICandidateRule>,
    position: TokenPosition,
    symbolTable: DocumentSymbolTable,
    document: Document
  ): Promise<CompletionItem[]> {
    const proposedSymbols: CompletionItem[] = [];

    if (rules.has(XXPParser.RULE_workflowNameRead)) {
      await this.suggestWorkflowNames(position, proposedSymbols, symbolTable, document);
    }
    if (rules.has(XXPParser.RULE_dataNameRead)) {
      await this.suggestAndStoreSymbols(
        position,
        DataSymbol,
        proposedSymbols,
        symbolTable,
        CompletionItemKind.Variable,
        document
      );
    }
    if (rules.has(XXPParser.RULE_taskNameRead)) {
      await this.suggestAndStoreSymbols(
        position,
        TaskSymbol,
        proposedSymbols,
        symbolTable,
        CompletionItemKind.Variable,
        document
      );
    }

    return proposedSymbols;
  }

  private getRuleName(ruleIndex: number): string {
    // Helper method to get rule names for debugging
    const ruleNames: { [key: number]: string } = {
      [XXPParser.RULE_workflowNameRead]: 'workflowNameRead',
      [XXPParser.RULE_dataNameRead]: 'dataNameRead',
      [XXPParser.RULE_taskNameRead]: 'taskNameRead',
    };
    return ruleNames[ruleIndex] || `rule_${ruleIndex}`;
  }

  private async fixTokensSuggestionForChains(
    tokens: Map<number, TokenList>,
    position: TokenPosition,
    tokenStream: CommonTokenStream,
    symbolTable: DocumentSymbolTable,
    documentUri: string
  ): Promise<void> {
    if (!tokens.has(XXPParser.ARROW)) {
      return;
    }

    const leftIdentifier = tokenStream.get(position.index - 1);

    const proposedDataIdentifiers = await symbolTable.getValidSymbolsAtPosition(
      position.parseTree,
      documentUri,
      DataSymbol
    );
    if (leftIdentifier.text && proposedDataIdentifiers.includes(leftIdentifier.text)) {
      tokens.delete(XXPParser.ARROW);
    }
  }

  private processTokens(
    tokens: Map<number, TokenList>,
    vocabulary: Vocabulary,
    tokenPosition?: TokenPosition,
    tokenStream?: CommonTokenStream
  ): CompletionItem[] {
    const proposedSymbols: CompletionItem[] = [];

    tokens.forEach((_, k) => {
      if (XxpSuggestionsProvider.visualSymbolsMap.has(k)) {
        proposedSymbols.push({
          label: XxpSuggestionsProvider.visualSymbolsMap.get(k) || '',
          kind: CompletionItemKind.Operator,
        });
      } else if (k !== XXPParser.IDENTIFIER) {
        const symbolicName = vocabulary.getSymbolicName(k);
        if (symbolicName === 'START' || symbolicName === 'END') {
          // Don't suggest START if we're already after START in a chain
          if (
            symbolicName === 'START' &&
            tokenPosition &&
            tokenStream &&
            this.isAfterStartInChain(tokenPosition, tokenStream)
          ) {
            return;
          }
          proposedSymbols.push({
            label: symbolicName,
            kind: CompletionItemKind.Keyword,
          });
        } else if (k === XXPParser.BOOLEAN) {
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

  private isAfterStartInChain(position: TokenPosition, tokenStream: CommonTokenStream): boolean {
    // Check if we're in a position like "START -> <cursor>"
    // Look back in the token stream to see if we have START followed by ->
    let index = position.index - 1;

    // Skip whitespace
    while (index >= 0) {
      const token = tokenStream.get(index);
      if (token.type === XXPParser.WS) {
        index--;
        continue;
      }

      // Check if this is an arrow
      if (token.type === XXPParser.ARROW) {
        // Look further back for START
        index--;
        while (index >= 0) {
          const prevToken = tokenStream.get(index);
          if (prevToken.type === XXPParser.WS) {
            index--;
            continue;
          }

          // Check if we found START
          if (prevToken.type === XXPParser.START) {
            return true;
          }

          // If we found something else, stop looking
          break;
        }
      }

      // If we found something other than arrow, stop looking
      break;
    }

    return false;
  }

  private async suggestWorkflowNames(
    position: TokenPosition,
    proposedSymbols: CompletionItem[],
    symbolTable: DocumentSymbolTable,
    document: Document
  ): Promise<void> {
    // Use generic symbol resolver utility
    const validWorkflows = await XxpSuggestionsProvider.getValidSymbolsOfType(
      document,
      position.parseTree,
      WorkflowSymbol,
      this.documentManager
    );

    // Filter out the current workflow (can't inherit from self)
    const currentWorkflowName = this.getWorkflowNameFromDocument(position);

    const filteredWorkflows = currentWorkflowName
      ? validWorkflows.filter(name => name !== currentWorkflowName)
      : validWorkflows;

    filteredWorkflows.forEach(workflowName => {
      proposedSymbols.push({
        label: workflowName,
        kind: CompletionItemKind.Class,
      });
    });
  }

  private async suggestAndStoreSymbols<T extends BaseSymbol>(
    position: TokenPosition,
    type: new (...args: any[]) => T,
    proposedSymbols: CompletionItem[],
    symbolTable: DocumentSymbolTable,
    kind: CompletionItemKind,
    document: Document
  ): Promise<void> {
    // Use generic symbol resolver utility
    const validSymbols = await XxpSuggestionsProvider.getValidSymbolsOfType(
      document,
      position.parseTree,
      type,
      this.documentManager
    );

    // For WorkflowSymbol, filter out the current workflow (can't inherit from self)
    const filteredSymbols =
      type.name === 'WorkflowSymbol'
        ? this.filterOutCurrentWorkflow(validSymbols, position)
        : validSymbols;

    filteredSymbols.forEach(s => {
      proposedSymbols.push({
        label: s,
        kind,
      });
    });
  }

  private filterOutCurrentWorkflow(workflowNames: string[], position: TokenPosition): string[] {
    // Try to find the current workflow name from the document text
    const currentWorkflowName = this.getWorkflowNameFromDocument(position);
    if (currentWorkflowName) {
      return workflowNames.filter(name => name !== currentWorkflowName);
    }
    return workflowNames;
  }

  private getWorkflowNameFromDocument(position: TokenPosition): string | null {
    // Try getting text from input stream using different approach
    const rootNode = this.getRootNode(position.parseTree);
    if (rootNode && rootNode.start && rootNode.start.inputStream) {
      try {
        // Try different ways to get the text
        let fullText: string | null = null;

        if (rootNode.start.inputStream.getText) {
          fullText = rootNode.start.inputStream.getText(0, rootNode.start.inputStream.size - 1);
        } else if (rootNode.start.inputStream.toString) {
          fullText = rootNode.start.inputStream.toString();
        } else if (rootNode.getText) {
          fullText = rootNode.getText();
        }

        if (fullText) {
          // Match "workflow DerivedWorkflow" pattern (with or without "from")
          const match = fullText.match(/workflow\s+(\w+)/);
          if (match && match[1]) {
            return match[1];
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Fallback: return null if we can't get the text
      }
    }
    return null;
  }

  private getRootNode(node: any): any {
    let currentNode = node;
    while (currentNode && currentNode.parent) {
      currentNode = currentNode.parent;
    }
    return currentNode;
  }

  private async getWorkflowInheritanceCompletions(
    position: TokenPosition,
    tokenStream: CommonTokenStream,
    symbolTable: DocumentSymbolTable,
    documentUri: string
  ): Promise<CompletionItem[]> {
    // Check if we're in a position for workflow inheritance (after "from" keyword)
    if (!this.isAfterFromKeywordInWorkflowHeader(position, tokenStream)) {
      return [];
    }

    // Get all available workflows from symbol table
    const allWorkflows = await symbolTable.getValidSymbolsAtPosition(
      position.parseTree,
      documentUri,
      WorkflowSymbol
    );

    // Filter out current workflow - get workflow name from document text
    const currentWorkflowName = this.getWorkflowNameFromDocument(position);

    const availableWorkflows = currentWorkflowName
      ? allWorkflows.filter(name => name !== currentWorkflowName)
      : allWorkflows;

    return availableWorkflows.map(workflowName => ({
      label: workflowName,
      kind: CompletionItemKind.Class,
      detail: 'Workflow',
    }));
  }

  private isAfterFromKeywordInWorkflowHeader(
    position: TokenPosition,
    tokenStream: CommonTokenStream
  ): boolean {
    // Look back in the token stream to find "from" keyword
    let index = position.index - 1;

    // Skip whitespace and look for FROM keyword
    while (index >= 0) {
      const token = tokenStream.get(index);
      if (token.type === XXPParser.WS) {
        index--;
        continue;
      }

      if (token.type === XXPParser.FROM) {
        // Found FROM, now check if we're in a workflow header by looking further back
        return this.isInWorkflowHeader(index, tokenStream);
      }

      // If we hit any other token, we're not directly after FROM
      break;
    }

    return false;
  }

  private isInWorkflowHeader(fromTokenIndex: number, tokenStream: CommonTokenStream): boolean {
    // Look back from FROM token to find WORKFLOW keyword and IDENTIFIER
    let index = fromTokenIndex - 1;
    let foundIdentifier = false;

    while (index >= 0) {
      const token = tokenStream.get(index);
      if (token.type === XXPParser.WS) {
        index--;
        continue;
      }

      if (token.type === XXPParser.IDENTIFIER && !foundIdentifier) {
        foundIdentifier = true;
        index--;
        continue;
      }

      if (token.type === XXPParser.WORKFLOW && foundIdentifier) {
        return true;
      }

      // If we hit anything else, we're not in a workflow header
      break;
    }

    return false;
  }

  private static async getValidSymbolsOfType<T extends BaseSymbol>(
    document: Document,
    parseTree: ParseTree,
    type: new (...args: any[]) => T,
    documentManager?: DocumentManager
  ): Promise<string[]> {
    // Use the document's existing method if available, otherwise fall back to folder symbol table
    if (document.symbolTable?.getValidSymbolsAtPosition) {
      return document.symbolTable.getValidSymbolsAtPosition(parseTree, document.uri, type);
    }

    // Fallback to folder symbol table
    const folderTable = documentManager?.getDocumentSymbolTableForFile(document.uri);
    if (folderTable?.getValidSymbolsAtPosition) {
      return folderTable.getValidSymbolsAtPosition(parseTree, document.uri, type);
    }

    return [];
  }
}
