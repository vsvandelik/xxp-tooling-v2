import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    InitializeParams,
    TextDocumentSyncKind,
    InitializeResult,
    Connection,
    ServerCapabilities,
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
        completionProvider: { resolveProvider: true },
        hoverProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        renameProvider: { prepareProvider: false },
        diagnosticProvider: {
            interFileDependencies: true,
            workspaceDiagnostics: false
        },
    };

    return { capabilities };
});

connection.onInitialized(() => {
    logger.info('DSL Language Server initialized');
    providersManager.registerProviders();
});

documents.onDidOpen(e => documentManager.onDocumentOpened(e.document));
documents.onDidClose(e => documentManager.onDocumentClosed(e.document));
documents.onDidChangeContent(e => documentManager.onDocumentChanged(e.document));

documents.listen(connection);
connection.listen();