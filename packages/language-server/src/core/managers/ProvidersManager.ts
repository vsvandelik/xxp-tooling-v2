import { Connection } from 'vscode-languageserver';

import { DiagnosticsProvider } from '../../providers/DiagnosticsProvider.js';
import { HoverProvider } from '../../providers/HoverProvider.js';
import { Provider } from '../../providers/Provider.js';
import { ReferencesProvider } from '../../providers/ReferencesProvider.js';
import { RenamerProvider } from '../../providers/RenamerProvider.js';
import { SuggestionsProvider } from '../../providers/SuggestionsProvider.js';
import { Logger } from '../../utils/Logger.js';

import { DocumentManager } from './DocumentsManager.js';

export class ProvidersManager {
  private readonly logger = Logger.getLogger();
  private readonly providers: Provider[] = [
    new DiagnosticsProvider(),
    new HoverProvider(),
    new ReferencesProvider(),
    new RenamerProvider(),
    new SuggestionsProvider(),
  ];

  constructor(
    private readonly connection: Connection,
    private readonly documentsManager: DocumentManager
  ) {}

  public registerProviders(): void {
    for (const provider of this.providers) {
      this.registerProvider(provider);
    }
  }

  private registerProvider(provider: Provider): void {
    provider.initialize(this.connection, this.documentsManager);
    provider.addHandlers();
    this.logger.info(`Registered provider: ${provider.constructor.name}`);
  }
}
