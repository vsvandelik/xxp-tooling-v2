import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { XxpSuggestionsProvider } from './XxpSuggestionsProvider.js';
import { EspaceSuggestionsProvider } from './EspaceSuggestionsProvider.js';
export class SuggestionsProvider extends Provider {
    logger = Logger.getLogger();
    XxpSuggestionsProvider = new XxpSuggestionsProvider();
    EspaceSuggestionsProvider = new EspaceSuggestionsProvider();
    initialize(connection, documentManager) {
        super.initialize(connection, documentManager);
        this.XxpSuggestionsProvider.initialize(connection, documentManager);
        this.EspaceSuggestionsProvider.initialize(connection, documentManager);
    }
    addHandlers() {
        this.connection.onCompletion(completionParams => this.onCompletion(completionParams));
        this.connection.onCompletionResolve(completionItem => this.onCompletionResolve(completionItem));
    }
    async onCompletion(params) {
        if (params.textDocument.uri.endsWith('.xxp')) {
            return this.XxpSuggestionsProvider.onCompletion(params);
        }
        else if (params.textDocument.uri.endsWith('.espace')) {
            return this.EspaceSuggestionsProvider.onCompletion(params);
        }
        else {
            this.logger.warn(`Unsupported document type for completion: ${params.textDocument.uri}`);
            return null;
        }
    }
    async onCompletionResolve(item) {
        this.logger.debug(`Resolving completion item: ${item.label}`);
        return item;
    }
}
//# sourceMappingURL=SuggestionsProvider.js.map