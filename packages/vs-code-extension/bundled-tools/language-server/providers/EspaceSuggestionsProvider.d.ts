import { Provider } from './Provider.js';
import { CompletionParams, CompletionItem } from 'vscode-languageserver';
export declare class EspaceSuggestionsProvider extends Provider {
    private logger;
    private static readonly ignoredTokens;
    private static readonly preferredRules;
    private static readonly visualSymbolsMap;
    addHandlers(): void;
    onCompletion(params: CompletionParams): Promise<CompletionItem[] | null>;
    private ensureCodeCompletionCoreInitialized;
    private processRules;
    private processTokens;
    private suggestAndStoreSymbols;
    private suggestWorkflowFiles;
    private suggestTasksFromReferencedWorkflow;
}
//# sourceMappingURL=EspaceSuggestionsProvider.d.ts.map