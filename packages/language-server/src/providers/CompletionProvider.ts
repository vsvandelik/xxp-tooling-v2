import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import {
  CompletionParams,
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
} from 'vscode-languageserver';
import { DataSymbol } from '../core/symbols/DataSymbol.js';
import { TaskSymbol } from '../core/symbols/TaskSymbol.js';
import { WorkflowSymbol } from '../core/symbols/WorkflowSymbol.js';
import { SpaceSymbol } from '../core/symbols/SpaceSymbol.js';
import { CodeCompletionCore } from 'antlr4-c3';
import { XXPParser, ESPACEParser } from '@extremexp/core';
import { Parser } from 'antlr4ng';

export class CompletionProvider extends Provider {
  private logger = Logger.getInstance();

  public addHandlers(): void {
    this.connection?.onCompletion(params => this.onCompletion(params));
    this.connection?.onCompletionResolve(item => this.onCompletionResolve(item));
  }

  private async onCompletion(params: CompletionParams): Promise<CompletionItem[] | null> {
    this.logger.info(`Received completion request for document: ${params.textDocument.uri}`);

    const result = this.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return null;
    const [document, tokenPosition] = result;

    const completionItems: CompletionItem[] = [];

    // Get context-aware completions using CodeCompletionCore
    if (document.parser && document.tokenStream) {
      const contextualCompletions = this.getContextualCompletions(
        document.parser,
        tokenPosition.index,
        document.uri
      );
      completionItems.push(...contextualCompletions);
    }

    // Add symbol-based completions
    await this.addSymbolCompletions(document, tokenPosition, completionItems);

    return completionItems;
  }

  private getContextualCompletions(
    parser: Parser,
    tokenIndex: number,
    uri: string
  ): CompletionItem[] {
    const core = new CodeCompletionCore(parser);
    const items: CompletionItem[] = [];

    // Configure preferred rules based on file type
    if (uri.endsWith('.xxp')) {
      core.preferredRules = new Set([
        XXPParser.RULE_workflowDeclaration,
        XXPParser.RULE_taskDefinition,
        XXPParser.RULE_dataDefinition,
        XXPParser.RULE_taskChain,
        XXPParser.RULE_taskConfiguration,
        XXPParser.RULE_implementation,
        XXPParser.RULE_paramAssignment,
        XXPParser.RULE_inputStatement,
        XXPParser.RULE_outputStatement,
      ]);
    } else if (uri.endsWith('.espace')) {
      core.preferredRules = new Set([
        ESPACEParser.RULE_experimentDeclaration,
        ESPACEParser.RULE_spaceDeclaration,
        ESPACEParser.RULE_dataDefinition,
        ESPACEParser.RULE_strategyStatement,
        ESPACEParser.RULE_paramDefinition,
        ESPACEParser.RULE_taskConfiguration,
        ESPACEParser.RULE_controlBlock,
        ESPACEParser.RULE_simpleTransition,
        ESPACEParser.RULE_conditionalTransition,
      ]);
    }

    try {
      const candidates = core.collectCandidates(tokenIndex);

      // Process tokens
      for (const [token, followList] of candidates.tokens) {
        const tokenName = parser.vocabulary.getSymbolicName(token);
        if (tokenName && this.shouldIncludeToken(tokenName)) {
          items.push(this.createTokenCompletionItem(tokenName, uri));
        }
      }

      // Process rules
      for (const [rule, followList] of candidates.rules) {
        const item = this.createRuleCompletionItem(rule, uri);
        if (item) items.push(item);
      }
    } catch (error) {
      this.logger.error(`Error getting contextual completions: ${error}`);
    }

    return items;
  }

  private shouldIncludeToken(tokenName: string): boolean {
    // Filter out structural tokens that shouldn't be in completions
    const excludedTokens = [
      'EOF',
      'NEWLINE',
      'WS',
      'COMMENT',
      'LINE_COMMENT',
      'LPAREN',
      'RPAREN',
      'LBRACE',
      'RBRACE',
      'SEMICOLON',
      'COMMA',
      'DOT',
      'COLON',
      'EQUALS',
      'ARROW',
    ];
    return !excludedTokens.includes(tokenName);
  }

  private createTokenCompletionItem(tokenName: string, uri: string): CompletionItem {
    const keyword = tokenName.toLowerCase();
    const kind = this.getCompletionItemKind(tokenName);

    // Create appropriate snippet based on keyword
    const snippets: { [key: string]: string } = {
      workflow: 'workflow ${1:WorkflowName} {\n\t$0\n}',
      experiment: 'experiment ${1:ExperimentName} {\n\t$0\n}',
      task: 'task ${1:TaskName};',
      data: 'data ${1:dataName} = "${2:path/to/file}";',
      space: 'space ${1:SpaceName} of ${2:WorkflowName} {\n\t$0\n}',
      configure: 'configure task ${1:TaskName} {\n\t$0\n}',
      implementation: 'implementation "${1:script.py}";',
      param: 'param ${1:paramName} = ${2:value};',
      strategy: 'strategy ${1|gridsearch,randomsearch|};',
      input: 'input ${1:dataName};',
      output: 'output ${1:dataName};',
      control: 'control {\n\tSTART -> ${1:space1} -> END;\n}',
      condition: 'condition ${1:expression};',
    };

    const item: CompletionItem = {
      label: keyword,
      kind,
      detail: `${tokenName} keyword`,
      insertText: snippets[keyword] || keyword,
      insertTextFormat: snippets[keyword] ? InsertTextFormat.Snippet : InsertTextFormat.PlainText,
    };

    return item;
  }

  private createRuleCompletionItem(rule: number, uri: string): CompletionItem | null {
    // Map rules to user-friendly completions
    const ruleCompletions: { [key: number]: CompletionItem } = {};

    if (uri.endsWith('.xxp')) {
      ruleCompletions[XXPParser.RULE_workflowDeclaration] = {
        label: 'New Workflow',
        kind: CompletionItemKind.Snippet,
        insertText: 'workflow ${1:WorkflowName} {\n\t$0\n}',
        insertTextFormat: InsertTextFormat.Snippet,
        detail: 'Create a new workflow declaration',
      };
    }

    return ruleCompletions[rule] || null;
  }

  private getCompletionItemKind(tokenName: string): CompletionItemKind {
    const structuralKeywords = ['workflow', 'experiment', 'task', 'space'];
    const statementKeywords = ['configure', 'control', 'define'];

    if (structuralKeywords.includes(tokenName.toLowerCase())) {
      return CompletionItemKind.Class;
    } else if (statementKeywords.includes(tokenName.toLowerCase())) {
      return CompletionItemKind.Function;
    }

    return CompletionItemKind.Keyword;
  }

  private async addSymbolCompletions(
    document: any,
    tokenPosition: any,
    completionItems: CompletionItem[]
  ): Promise<void> {
    if (!document.symbolTable) return;

    // Determine what type of symbol we should suggest based on context
    const context = this.getCompletionContext(tokenPosition);
    const allSymbols = await document.symbolTable.getAllNestedSymbols();

    for (const symbol of allSymbols) {
      if (this.shouldIncludeSymbol(symbol, context)) {
        completionItems.push(this.createSymbolCompletionItem(symbol));
      }
    }
  }

  private getCompletionContext(tokenPosition: any): string {
    // Analyze the parse tree context to determine what type of completion is needed
    const contextNode = tokenPosition.parseTree;
    const ruleName = contextNode.constructor.name;

    if (ruleName.includes('TaskNameRead')) return 'task';
    if (ruleName.includes('DataNameRead')) return 'data';
    if (ruleName.includes('WorkflowNameRead')) return 'workflow';
    if (ruleName.includes('SpaceNameRead')) return 'space';

    return 'any';
  }

  private shouldIncludeSymbol(symbol: any, context: string): boolean {
    if (context === 'any') return true;

    switch (context) {
      case 'task':
        return symbol instanceof TaskSymbol;
      case 'data':
        return symbol instanceof DataSymbol;
      case 'workflow':
        return symbol instanceof WorkflowSymbol;
      case 'space':
        return symbol instanceof SpaceSymbol;
      default:
        return true;
    }
  }

  private createSymbolCompletionItem(symbol: any): CompletionItem {
    let kind: CompletionItemKind;
    let detail: string;
    let documentation: string | undefined;

    if (symbol instanceof WorkflowSymbol) {
      kind = CompletionItemKind.Class;
      detail = 'Workflow';
      documentation = symbol.parentWorkflow
        ? `Workflow extending ${symbol.parentWorkflow.name}`
        : 'Workflow declaration';
    } else if (symbol instanceof TaskSymbol) {
      kind = CompletionItemKind.Function;
      detail = 'Task';
      documentation = symbol.implementation
        ? `Task with implementation: ${symbol.implementation}`
        : 'Task declaration';
    } else if (symbol instanceof DataSymbol) {
      kind = CompletionItemKind.Variable;
      detail = 'Data';
      documentation = symbol.value ? `Data: ${symbol.value}` : 'Data declaration';
    } else if (symbol instanceof SpaceSymbol) {
      kind = CompletionItemKind.Module;
      detail = 'Space';
      documentation = `Space of workflow ${symbol.workflowName}`;
    } else {
      kind = CompletionItemKind.Text;
      detail = symbol.constructor.name;
    }

    return {
      label: symbol.name,
      kind,
      detail,
      documentation,
    };
  }

  private async onCompletionResolve(item: CompletionItem): Promise<CompletionItem> {
    this.logger.debug(`Resolving completion item: ${item.label}`);

    // Add more detailed documentation when item is selected
    if (!item.documentation) {
      item.documentation = `Documentation for ${item.label}`;
    }

    return item;
  }
}
