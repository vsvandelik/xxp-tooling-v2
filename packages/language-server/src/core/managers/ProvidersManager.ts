import { Connection } from 'vscode-languageserver';
import { Provider } from '../../providers/Provider.js';
import { DocumentManager } from './DocumentManager.js';
import { DiagnosticsProvider } from '../../providers/DiagnosticsProvider.js';
import { HoverProvider } from '../../providers/HoverProvider.js';
import { CompletionProvider } from '../../providers/CompletionProvider.js';
import { ReferencesProvider } from '../../providers/ReferencesProvider.js';
import { RenameProvider } from '../../providers/RenameProvider.js';
import { DefinitionProvider } from '../../providers/DefinitionProvider.js';
import { CodeActionProvider } from '../../providers/CodeActionProvider.js';
import { DocumentSymbolProvider } from '../../providers/DocumentSymbolProvider.js';
import { Logger } from '../../utils/Logger.js';

export class ProvidersManager {
  private readonly logger = Logger.getInstance();
  private readonly providers: Provider[] = [
    new DiagnosticsProvider(),
    new HoverProvider(),
    new CompletionProvider(),
    new ReferencesProvider(),
    new RenameProvider(),
    new DefinitionProvider(),
    new CodeActionProvider(),
    new DocumentSymbolProvider(),
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
