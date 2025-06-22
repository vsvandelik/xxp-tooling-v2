import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  Connection,
  ServerCapabilities,
  CodeActionKind,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentManager } from './core/managers/DocumentManager.js';
import { ProvidersManager } from './core/managers/ProvidersManager.js';
import { Logger } from './utils/Logger.js';

const connection: Connection = createConnection(ProposedFeatures.all);
const logger = Logger.initialize(connection);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
const documentManager = new DocumentManager();
const providersManager = new ProvidersManager(connection, documentManager);

connection.onInitialize((params: InitializeParams): InitializeResult => {
  logger.info('Initializing DSL Language Server');

  const capabilities: ServerCapabilities = {
    textDocumentSync: TextDocumentSyncKind.Incremental,
    completionProvider: {
      resolveProvider: true,
      triggerCharacters: ['.', ':', ' ', '"'],
    },
    hoverProvider: true,
    definitionProvider: true,
    referencesProvider: true,
    renameProvider: { prepareProvider: false },
    documentSymbolProvider: true,
    codeActionProvider: {
      codeActionKinds: [
        CodeActionKind.QuickFix,
        CodeActionKind.Refactor,
        CodeActionKind.RefactorExtract,
        CodeActionKind.RefactorInline,
      ],
    },
    diagnosticProvider: {
      interFileDependencies: true,
      workspaceDiagnostics: false,
    },
  };

  return { capabilities };
});

connection.onInitialized(() => {
  logger.info('DSL Language Server initialized');
  providersManager.registerProviders();
});

// Handle shutdown request
connection.onShutdown(() => {
  logger.info('DSL Language Server shutting down');
});

documents.onDidOpen(e => documentManager.onDocumentOpened(e.document));
documents.onDidClose(e => documentManager.onDocumentClosed(e.document));
documents.onDidChangeContent(e => documentManager.onDocumentChanged(e.document));

documents.listen(connection);
connection.listen();
