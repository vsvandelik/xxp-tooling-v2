import { Provider } from './Provider.js';
import { CompletionParams, CompletionItem, Connection } from 'vscode-languageserver';
import { DocumentManager } from '../core/managers/DocumentsManager.js';
export declare class SuggestionsProvider extends Provider {
    private logger;
    private readonly XxpSuggestionsProvider;
    private readonly EspaceSuggestionsProvider;
    initialize(connection: Connection, documentManager: DocumentManager): void;
    addHandlers(): void;
    onCompletion(params: CompletionParams): Promise<CompletionItem[] | null>;
    private onCompletionResolve;
}
//# sourceMappingURL=SuggestionsProvider.d.ts.map