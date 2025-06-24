import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { CompletionParams, CompletionItem, CompletionItemKind } from 'vscode-languageserver';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { BaseSymbol, CodeCompletionCore, ICandidateRule, TokenList } from 'antlr4-c3';
import { Document } from '../core/documents/Document.js';
import { DataSymbol } from '../core/models/symbols/DataSymbol.js';
import { TaskSymbol } from '../core/models/symbols/TaskSymbol.js';
import { TokenPosition } from '../core/models/TokenPosition.js';
import { DocumentSymbolTable } from '../language/symbolTable/DocumentSymbolTable.js';
import { CommonTokenStream, Vocabulary } from 'antlr4ng';
import { XXPParser } from '@extremexp/core';

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

    await this.fixTokensSuggestionForChains(
      candidates.tokens,
      tokenPosition,
      document.tokenStream!,
      document.symbolTable!
    );
    await this.fixRulesSuggestionForChains(
      candidates.rules,
      tokenPosition,
      document.tokenStream!,
      document.symbolTable!
    );
    symbols.push(
      ...(await this.processRules(candidates.rules, tokenPosition, document.symbolTable!))
    );
    symbols.push(...this.processTokens(candidates.tokens, document.parser!.vocabulary));

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
    symbolTable: DocumentSymbolTable
  ): Promise<CompletionItem[]> {
    const proposedSymbols: CompletionItem[] = [];

    if (rules.has(XXPParser.RULE_workflowNameRead)) {
      await this.suggestAndStoreSymbols(
        position,
        WorkflowSymbol,
        proposedSymbols,
        symbolTable,
        CompletionItemKind.Class
      );
    }
    if (rules.has(XXPParser.RULE_dataNameRead)) {
      await this.suggestAndStoreSymbols(
        position,
        DataSymbol,
        proposedSymbols,
        symbolTable,
        CompletionItemKind.Variable
      );
    }
    if (rules.has(XXPParser.RULE_taskNameRead)) {
      await this.suggestAndStoreSymbols(
        position,
        TaskSymbol,
        proposedSymbols,
        symbolTable,
        CompletionItemKind.Variable
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
    symbolTable: DocumentSymbolTable
  ): Promise<void> {
    if (!tokens.has(XXPParser.ARROW)) {
      return;
    }

    const leftIdentifier = tokenStream.get(position.index - 1);

    const proposedDataIdentifiers = await symbolTable.getValidSymbolsAtPosition(
      position.parseTree,
      DataSymbol
    );
    if (leftIdentifier.text && proposedDataIdentifiers.includes(leftIdentifier.text)) {
      tokens.delete(XXPParser.ARROW);
    }
  }

  private async fixRulesSuggestionForChains(
    rules: Map<number, ICandidateRule>,
    position: TokenPosition,
    tokenStream: CommonTokenStream,
    symbolTable: DocumentSymbolTable
  ): Promise<void> {
    if (!rules.has(XXPParser.RULE_dataNameRead) || !rules.has(XXPParser.RULE_taskNameRead)) {
      return;
    }
    const leftIdentifier = tokenStream.get(position.index - 3); // -3 because of the arrow token and space token

    const proposedDataIdentifiers = await symbolTable.getValidSymbolsAtPosition(
      position.parseTree,
      DataSymbol
    );
    if (leftIdentifier.text && proposedDataIdentifiers.includes(leftIdentifier.text)) {
      rules.delete(XXPParser.RULE_dataNameRead);
    }

    const proposedTaskIdentifiers = await symbolTable.getValidSymbolsAtPosition(
      position.parseTree,
      TaskSymbol
    );
    if (leftIdentifier.text && proposedTaskIdentifiers.includes(leftIdentifier.text)) {
      rules.delete(XXPParser.RULE_taskNameRead);
    }
  }

  private processTokens(tokens: Map<number, TokenList>, vocabulary: Vocabulary): CompletionItem[] {
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
          proposedSymbols.push({
            label: symbolicName,
            kind: CompletionItemKind.Keyword,
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
    kind: CompletionItemKind
  ): Promise<void> {
    const validSymbols = await symbolTable.getValidSymbolsAtPosition(position.parseTree, type);
    validSymbols.forEach(s => {
      proposedSymbols.push({
        label: s,
        kind,
      });
    });
  }
}
