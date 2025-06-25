import { Provider } from './Provider.js';
import { CompletionParams, CompletionItem } from 'vscode-languageserver';
export declare class XxpSuggestionsProvider extends Provider {
    private logger;
    private static readonly ignoredTokens;
    private static readonly preferredRules;
    private static readonly visualSymbolsMap;
    addHandlers(): void;
    onCompletion(params: CompletionParams): Promise<CompletionItem[] | null>;
    private ensureCodeCompletionCoreInitialized;
    private processRules;
    private getRuleName;
    private fixTokensSuggestionForChains;
    private fixRulesSuggestionForChains;
    private processTokens;
    private isAfterStartInChain;
    private suggestWorkflowNames;
    private suggestAndStoreSymbols;
    private filterOutCurrentWorkflow;
    private getWorkflowNameFromDocument;
    private getRootNode;
    private getWorkflowInheritanceCompletions;
    private isAfterFromKeywordInWorkflowHeader;
    private isInWorkflowHeader;
}
//# sourceMappingURL=XxpSuggestionsProvider.d.ts.map