// packages/language-server/src/completion/CompletionEngine.ts
import { ParseTree, Token, CommonTokenStream } from 'antlr4ng';
import { DocumentManager } from '../documents/DocumentManager.js';
import { ParsedDocument } from '../types/ParsedDocument.js';
import { CompletionContext } from './CompletionContext.js';
import { ASTUtils } from '../utils/ASTUtils.js';
import { CodeCompletionCore } from 'antlr4-c3';
import { XXPLexer, XXPParser, ESPACELexer, ESPACEParser } from '@extremexp/core';

export class CompletionEngine {
  constructor(private documentManager: DocumentManager) {}

  analyzeContext(document: ParsedDocument, line: number, character: number): CompletionContext {
    const context: CompletionContext = {
      uri: document.uri,
      languageId: document.languageId as 'xxp' | 'espace',
      line,
      character,
      lineText: '',
      linePrefix: '',
      lineSuffix: '',
      isTopLevel: false,
      isInWorkflowBody: false,
      isInExperimentBody: false,
      isInSpaceBody: false,
      isInTaskConfiguration: false,
      isInControlBlock: false,
      isInTaskChain: false,
      expectsKeyword: false,
      expectsReference: false,
      expectsValue: false,
      expectsWorkflowName: false,
      expectsTaskName: false,
      expectsSpaceName: false,
      expectsParameterName: false,
      expectsDataName: false,
      expectsStrategyName: false,
      possibleKeywords: [],
      hasTaskChain: false,
      hasStrategy: false,
      hasStart: false,
      canAddEnd: false,
      usedTasks: new Set(),
    }; // Get line content
    const lines = document.document.getText().split('\n');
    if (line < lines.length && lines[line] !== undefined) {
      context.lineText = lines[line];
      context.linePrefix = context.lineText.substring(0, character);
      context.lineSuffix = context.lineText.substring(character);
    }

    // Extract last token
    const tokens = context.linePrefix.split(/\s+/);
    context.lastToken = tokens[tokens.length - 1] || '';

    // Use filter if we're in the middle of typing
    if (context.lastToken && !context.linePrefix.endsWith(' ')) {
      context.filter = context.lastToken;
    }

    // Analyze structural context
    this.analyzeStructuralContext(context, document, line, character);

    // Analyze expected elements using antlr4-c3
    this.analyzeExpectedElements(context, document, line, character);

    return context;
  }

  private analyzeStructuralContext(
    context: CompletionContext,
    document: ParsedDocument,
    line: number,
    character: number
  ): void {
    if (!document.parseTree || !document.tokens) return;

    // Find the current parse tree node
    const node = this.documentManager.getNodeAtPosition(document.uri, line, character);

    if (!node) {
      context.isTopLevel = true;
      return;
    }

    // Walk up the tree to determine context
    const ancestors = ASTUtils.getAncestors(node);

    for (const ancestor of ancestors) {
      const ruleName = ASTUtils.getRuleName(ancestor);

      switch (ruleName) {
        case 'workflowBody':
          context.isInWorkflowBody = true;
          context.workflow = this.extractWorkflowName(ancestor);
          break;

        case 'experimentBody':
          context.isInExperimentBody = true;
          context.experiment = this.extractExperimentName(ancestor);
          break;

        case 'spaceBody':
          context.isInSpaceBody = true;
          context.space = this.extractSpaceName(ancestor);
          break;

        case 'taskConfigurationBody':
          context.isInTaskConfiguration = true;
          context.task = this.extractTaskName(ancestor);
          break;

        case 'controlBody':
          context.isInControlBlock = true;
          break;

        case 'taskChain':
          context.isInTaskChain = true;
          break;
      }
    }

    // Additional analysis based on document analysis
    if (document.analysis) {
      if (document.languageId === 'xxp' && document.analysis.workflow) {
        context.hasTaskChain = !!document.analysis.workflow.taskChain;

        if (document.analysis.workflow.taskChain) {
          context.hasStart = document.analysis.workflow.taskChain.elements.includes('START');
          context.canAddEnd = !document.analysis.workflow.taskChain.elements.includes('END');

          for (const element of document.analysis.workflow.taskChain.elements) {
            if (element !== 'START' && element !== 'END') {
              context.usedTasks.add(element);
            }
          }
        }
      }

      if (document.languageId === 'espace' && document.analysis.experiment) {
        if (context.space) {
          const spaceAnalysis = document.analysis.experiment.spaces.find(
            s => s.name === context.space
          );
          if (spaceAnalysis) {
            context.hasStrategy = true;
            context.workflow = spaceAnalysis.workflowName;
          }
        }
      }
    }
  }
  private analyzeExpectedElements(
    context: CompletionContext,
    document: ParsedDocument,
    line: number,
    character: number
  ): void {
    // TODO: Implement ANTLR-based completion analysis
    // This is temporarily disabled to fix compilation issues
    /*
    if (!document.tokens) return;

    try {
      // Get the token index at the cursor position
      const tokenIndex = this.getTokenIndexAtPosition(document.tokens, line, character);
      if (tokenIndex === -1) return;      // Create code completion core
      const ParserClass = document.languageId === 'xxp' ? XXPParser : ESPACEParser;
      const core = new CodeCompletionCore(ParserClass);

      // Configure preferred rules
      if (document.languageId === 'xxp') {
        core.preferredRules = new Set([
          XXPParser.RULE_workflowDeclaration,
          XXPParser.RULE_taskDefinition,
          XXPParser.RULE_taskConfiguration,
          XXPParser.RULE_taskChain,
          XXPParser.RULE_paramAssignment,
        ]);
      } else {
        core.preferredRules = new Set([
          ESPACEParser.RULE_experimentDeclaration,
          ESPACEParser.RULE_spaceDeclaration,
          ESPACEParser.RULE_controlBlock,
          ESPACEParser.RULE_paramDefinition,
          ESPACEParser.RULE_taskConfiguration,
        ]);
      }

      // Collect candidates
      const candidates = core.collectCandidates(tokenIndex, document.parseTree);

      // Process tokens
      this.processTokenCandidates(context, candidates.tokens, document.languageId);

      // Process rules
      this.processRuleCandidates(context, candidates.rules, document.languageId);
    } catch (error) {
      console.error('Error in completion analysis:', error);
    }
    */
  }

  private getTokenIndexAtPosition(
    tokens: CommonTokenStream,
    line: number,
    character: number
  ): number {
    const allTokens = tokens.getTokens();
    for (let i = 0; i < allTokens.length; i++) {
      const token = allTokens[i];
      if (token && token.line === line + 1) {
        // ANTLR lines are 1-based
        const start = token.column;
        const end = start + (token.text?.length || 0);

        if (character >= start && character <= end) {
          return i;
        }
      }
    }

    // If no exact match, find the closest token before cursor
    for (let i = allTokens.length - 1; i >= 0; i--) {
      const token = allTokens[i];
      if (token && token.line === line + 1 && token.column <= character) {
        return i;
      }
      if (token && token.line < line + 1) {
        return i;
      }
    }

    return -1;
  }

  private processTokenCandidates(
    context: CompletionContext,
    tokens: Set<number>,
    languageId: string
  ): void {
    const tokenMap = languageId === 'xxp' ? XXPLexer : ESPACELexer;

    for (const token of tokens) {
      const tokenName = this.getTokenName(token, tokenMap);

      switch (tokenName) {
        case 'WORKFLOW':
        case 'EXPERIMENT':
        case 'SPACE':
        case 'TASK':
        case 'DATA':
        case 'PARAM':
        case 'STRATEGY':
        case 'CONTROL':
        case 'CONFIGURE':
        case 'DEFINE':
        case 'INPUT':
        case 'OUTPUT':
        case 'IMPLEMENTATION':
          context.expectsKeyword = true;
          context.possibleKeywords.push(tokenName.toLowerCase());
          break;

        case 'IDENTIFIER':
          context.expectsReference = true;
          break;

        case 'NUMBER':
        case 'STRING':
        case 'BOOLEAN':
          context.expectsValue = true;
          break;
      }
    }
  }

  private processRuleCandidates(
    context: CompletionContext,
    rules: Map<number, any>,
    languageId: string
  ): void {
    const parserClass = languageId === 'xxp' ? XXPParser : ESPACEParser;

    for (const [rule] of rules) {
      const ruleName = this.getRuleName(rule, parserClass);

      switch (ruleName) {
        case 'workflowNameRead':
          context.expectsWorkflowName = true;
          break;

        case 'taskNameRead':
          context.expectsTaskName = true;
          break;

        case 'spaceNameRead':
          context.expectsSpaceName = true;
          break;

        case 'dataNameRead':
          context.expectsDataName = true;
          break;

        case 'strategyStatement':
          context.expectsStrategyName = true;
          break;
      }
    }
  }

  private extractWorkflowName(node: ParseTree): string | undefined {
    // Implementation would extract workflow name from the parse tree
    return undefined;
  }

  private extractExperimentName(node: ParseTree): string | undefined {
    // Implementation would extract experiment name from the parse tree
    return undefined;
  }

  private extractSpaceName(node: ParseTree): string | undefined {
    // Implementation would extract space name from the parse tree
    return undefined;
  }

  private extractTaskName(node: ParseTree): string | undefined {
    // Implementation would extract task name from the parse tree
    return undefined;
  }

  private getTokenName(token: number, lexer: any): string {
    // Get token name from lexer vocabulary
    return lexer.symbolicNames[token] || '';
  }

  private getRuleName(rule: number, parser: any): string {
    // Get rule name from parser
    return parser.ruleNames[rule] || '';
  }
}
