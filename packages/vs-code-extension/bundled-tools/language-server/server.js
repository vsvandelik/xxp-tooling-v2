import { createConnection, TextDocuments, ProposedFeatures, TextDocumentSyncKind, } from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Logger } from './utils/Logger.js';
import { DocumentManager } from './core/managers/DocumentsManager.js';
import { ProvidersManager } from './core/managers/ProvidersManager.js';
const connection = createConnection(ProposedFeatures.all);
const logger = Logger.setupLogger(connection);
console.log('Language server starting...');
console.log('Process args:', process.argv);
console.log('Debug port should be available on 6009');
const documents = new TextDocuments(TextDocument);
const documentManager = new DocumentManager();
const providersManager = new ProvidersManager(connection, documentManager);
connection.onInitialize(() => {
    logger.info('Initializing XXP Language Server');
    const capabilities = {
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
documents.onDidOpen(e => documentManager.onDocumentOpened(e.document));
documents.onDidClose(e => documentManager.onDocumentClosed(e.document));
documents.onDidChangeContent(e => documentManager.onDocumentChanged(e.document));
documents.onDidSave(e => documentManager.onDocumentSaved(e.document));
documents.listen(connection);
connection.listen();
providersManager.registerProviders();
//# sourceMappingURL=server.js.map