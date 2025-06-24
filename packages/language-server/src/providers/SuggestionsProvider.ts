import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { CompletionParams, CompletionItem, CompletionItemKind, Connection } from 'vscode-languageserver';
import { BaseSymbol, CodeCompletionCore, ICandidateRule, TokenList } from 'antlr4-c3';
import { Document } from '../core/documents/Document.js';
import { DataSymbol } from '../core/models/symbols/DataSymbol.js';
import { TaskSymbol } from '../core/models/symbols/TaskSymbol.js';
import { SpaceSymbol } from '../core/models/symbols/SpaceSymbol.js';
import { ParamSymbol } from '../core/models/symbols/ParamSymbol.js';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { TokenPosition } from '../core/models/TokenPosition.js';
import { DocumentSymbolTable } from '../language/symbolTable/DocumentSymbolTable.js';
import { CommonTokenStream, Vocabulary } from 'antlr4ng';
import { ESPACEParser } from '@extremexp/core';
import { XxpSuggestionsProvider } from './XxpSuggestionsProvider.js';
import { EspaceSuggestionsProvider } from './EspaceSuggestionsProvider.js';
import { DocumentManager } from '../core/managers/DocumentsManager.js';

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

  private async onCompletion(params: CompletionParams): Promise<CompletionItem[] | null> {
    if (params.textDocument.uri.endsWith('.xxp'))
        return this.XxpSuggestionsProvider.onCompletion(params);
    else if (params.textDocument.uri.endsWith('.espace'))
        return this.EspaceSuggestionsProvider.onCompletion(params);
    else {
        this.logger.warn(`Unsupported document type for completion: ${params.textDocument.uri}`);
        return null;
    }
  }

  private async onCompletionResolve(item: CompletionItem): Promise<CompletionItem> {
    this.logger.debug(`Resolving completion item: ${item.label}`);
    return item;
  }
}
