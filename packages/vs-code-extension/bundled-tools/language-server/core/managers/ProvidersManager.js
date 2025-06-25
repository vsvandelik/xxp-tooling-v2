import { DiagnosticsProvider } from '../../providers/DiagnosticsProvider.js';
import { Logger } from '../../utils/Logger.js';
import { HoverProvider } from '../../providers/HoverProvider.js';
import { ReferencesProvider } from '../../providers/ReferencesProvider.js';
import { RenamerProvider } from '../../providers/RenamerProvider.js';
import { SuggestionsProvider } from '../../providers/SuggestionsProvider.js';
export class ProvidersManager {
    connection;
    documentsManager;
    logger = Logger.getLogger();
    providers = [
        new DiagnosticsProvider(),
        new HoverProvider(),
        new ReferencesProvider(),
        new RenamerProvider(),
        new SuggestionsProvider(),
    ];
    constructor(connection, documentsManager) {
        this.connection = connection;
        this.documentsManager = documentsManager;
    }
    registerProviders() {
        for (const provider of this.providers) {
            this.registerProvider(provider);
        }
    }
    registerProvider(provider) {
        provider.initialize(this.connection, this.documentsManager);
        provider.addHandlers();
        this.logger.info(`Registered provider: ${provider.constructor.name}`);
    }
}
//# sourceMappingURL=ProvidersManager.js.map