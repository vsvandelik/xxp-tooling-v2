import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  TextDocumentSyncKind,
  InitializeResult,
  Connection,
  ServerCapabilities,
} from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { DocumentManager } from './core/managers/DocumentsManager.js';
import { ProvidersManager } from './core/managers/ProvidersManager.js';
import { Logger } from './utils/Logger.js';

// Create a connection for the server
const connection: Connection = createConnection(ProposedFeatures.all);
const logger = Logger.setupLogger(connection);

console.log('Language server starting...');
console.log('Process args:', process.argv);
console.log('Debug port should be available on 6009');

// Create a document manager with all open documents
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Create our core services
const documentManager = new DocumentManager();

// Create a providers manager
const providersManager = new ProvidersManager(connection, documentManager);

connection.onInitialize((): InitializeResult => {
  logger.info('Initializing XXP Language Server');

  // Declare server capabilities
  const capabilities: ServerCapabilities = {
    textDocumentSync: TextDocumentSyncKind.Incremental,
    completionProvider: {
      resolveProvider: true,
    },
    hoverProvider: true,
    definitionProvider: true,
    referencesProvider: true,
    renameProvider: {
      prepareProvider: false,
    },
    diagnosticProvider: {
      interFileDependencies: true,
      workspaceDiagnostics: false,
    },
  };

  return {
    capabilities,
  };
});

connection.onInitialized(() => {
  logger.info('XXP Language Server initialized');
});

// Register handlers for document lifecycle events
documents.onDidOpen(e => documentManager.onDocumentOpened(e.document));
documents.onDidClose(e => documentManager.onDocumentClosed(e.document));
documents.onDidChangeContent(e => documentManager.onDocumentChanged(e.document));
documents.onDidSave(e => documentManager.onDocumentSaved(e.document));

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();

// Register providers
providersManager.registerProviders();
