import { CompletionParams, CompletionItem, Connection } from 'vscode-languageserver';

import { DocumentManager } from '../core/managers/DocumentsManager.js';
import { Logger } from '../utils/Logger.js';

import { EspaceSuggestionsProvider } from './EspaceSuggestionsProvider.js';
import { Provider } from './Provider.js';
import { XxpSuggestionsProvider } from './XxpSuggestionsProvider.js';

export class SuggestionsProvider extends Provider {
  private logger = Logger.getLogger();

  private readonly XxpSuggestionsProvider = new XxpSuggestionsProvider();
  private readonly EspaceSuggestionsProvider = new EspaceSuggestionsProvider();

  override initialize(connection: Connection, documentManager: DocumentManager): void {
    super.initialize(connection, documentManager);
    this.XxpSuggestionsProvider.initialize(connection, documentManager);
    this.EspaceSuggestionsProvider.initialize(connection, documentManager);
  }

  addHandlers(): void {
    this.connection!.onCompletion(completionParams => this.onCompletion(completionParams));
    this.connection!.onCompletionResolve(completionItem =>
      this.onCompletionResolve(completionItem)
    );
  }

  public async onCompletion(params: CompletionParams): Promise<CompletionItem[] | null> {
    if (params.textDocument.uri.endsWith('.xxp')) {
      return this.XxpSuggestionsProvider.onCompletion(params);
    } else if (params.textDocument.uri.endsWith('.espace')) {
      return this.EspaceSuggestionsProvider.onCompletion(params);
    } else {
      this.logger.warn(`Unsupported document type for completion: ${params.textDocument.uri}`);
      return null;
    }
  }

  private async onCompletionResolve(item: CompletionItem): Promise<CompletionItem> {
    this.logger.debug(`Resolving completion item: ${item.label}`);
    return item;
  }
}
