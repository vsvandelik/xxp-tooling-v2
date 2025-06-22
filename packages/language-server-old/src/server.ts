// packages/language-server/src/server.ts
import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  CompletionItem,
  TextDocumentPositionParams,
  Definition,
  Location,
  ReferenceParams,
  WorkspaceEdit,
  RenameParams,
  Hover,
  DocumentSymbolParams,
  DocumentSymbol,
  CodeActionParams,
  CodeAction,
  DiagnosticSeverity,
  Diagnostic,
} from 'vscode-languageserver/node.js';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentManager } from './documents/DocumentManager.js';
import { CompletionProvider } from './features/CompletionProvider.js';
import { DefinitionProvider } from './features/DefinitionProvider.js';
import { ReferenceProvider } from './features/ReferenceProvider.js';
import { RenameProvider } from './features/RenameProvider.js';
import { DiagnosticProvider } from './features/DiagnosticProvider.js';
import { HoverProvider } from './features/HoverProvider.js';
import { DocumentSymbolProvider } from './features/DocumentSymbolProvider.js';
import { CodeActionProvider } from './features/CodeActionProvider.js';
import { WorkspaceManager } from './workspace/WorkspaceManager.js';

// Create a connection for the server using Node's IPC as a transport
const connection = createConnection(ProposedFeatures.all);

// Create a text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Logging utility
function logInfo(message: string): void {
  connection.console.info(`[ExtremeXP LS] ${message}`);
}

function logError(message: string, error?: unknown): void {
  const errorMsg = error ? ` - ${String(error)}` : '';
  connection.console.error(`[ExtremeXP LS ERROR] ${message}${errorMsg}`);
}

function logDebug(message: string): void {
  connection.console.log(`[ExtremeXP LS DEBUG] ${message}`);
}

// Initialize managers and providers
let documentManager: DocumentManager;
let workspaceManager: WorkspaceManager;
let completionProvider: CompletionProvider;
let definitionProvider: DefinitionProvider;
let referenceProvider: ReferenceProvider;
let renameProvider: RenameProvider;
let diagnosticProvider: DiagnosticProvider;
let hoverProvider: HoverProvider;
let documentSymbolProvider: DocumentSymbolProvider;
let codeActionProvider: CodeActionProvider;

// Initialize parameters
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams): InitializeResult => {
  logInfo('Language server initializing...');
  const capabilities = params.capabilities;

  // Check client capabilities
  hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  logInfo(
    `Capabilities detected - Config: ${hasConfigurationCapability}, Workspace: ${hasWorkspaceFolderCapability}, Diagnostics: ${hasDiagnosticRelatedInformationCapability}`
  );

  // Initialize all components
  try {
    workspaceManager = new WorkspaceManager(params.workspaceFolders || []);
    logInfo('WorkspaceManager initialized');

    documentManager = new DocumentManager(workspaceManager);
    logInfo('DocumentManager initialized');

    diagnosticProvider = new DiagnosticProvider(
      connection,
      documentManager,
      hasDiagnosticRelatedInformationCapability
    );
    logInfo('DiagnosticProvider initialized');

    completionProvider = new CompletionProvider(documentManager);
    definitionProvider = new DefinitionProvider(documentManager);
    referenceProvider = new ReferenceProvider(documentManager);
    renameProvider = new RenameProvider(documentManager);
    hoverProvider = new HoverProvider(documentManager);
    documentSymbolProvider = new DocumentSymbolProvider(documentManager);
    codeActionProvider = new CodeActionProvider(documentManager);
    logInfo('All feature providers initialized');
  } catch (error) {
    logError('Failed to initialize components', error);
    throw error;
  }

  // Return server capabilities
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['.', ':', ' ', '=', '(', '"', ','], // todo
      },
      hoverProvider: true,
      definitionProvider: true,
      referencesProvider: true,
      documentSymbolProvider: true,
      renameProvider: {
        prepareProvider: true,
      },
      codeActionProvider: {
        codeActionKinds: ['quickfix', 'refactor'],
      },
      workspace: {
        workspaceFolders: {
          supported: hasWorkspaceFolderCapability,
        },
      },
    },
  };

  logInfo('Language server initialization completed successfully');
  return result;
});

connection.onInitialized(() => {
  logInfo('Language server initialized and ready');

  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(event => {
      logInfo(`Workspace folders changed: +${event.added.length}, -${event.removed.length}`);
      workspaceManager.updateWorkspaceFolders({ event });
    });
  }
});

// Document change handlers
documents.onDidOpen(event => {
  logInfo(`Document opened: ${event.document.uri}`);
  documentManager.openDocument(event.document);
  diagnosticProvider.validateDocument(event.document);
});

documents.onDidChangeContent(event => {
  logInfo(`Document changed: ${event.document.uri}`);
  documentManager.updateDocument(event.document);
  diagnosticProvider.validateDocument(event.document);
});

documents.onDidClose(event => {
  logInfo(`Document closed: ${event.document.uri}`);
  documentManager.closeDocument(event.document.uri);
  connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

// Feature handlers
connection.onCompletion(async (params: TextDocumentPositionParams): Promise<CompletionItem[]> => {
  try {
    logInfo(
      `Completion requested at ${params.textDocument.uri}:${params.position.line}:${params.position.character}`
    );
    return completionProvider.provideCompletions(params);
  } catch (error) {
    logError('Error providing completions', error);
    return [];
  }
});

connection.onCompletionResolve(async (item: CompletionItem): Promise<CompletionItem> => {
  try {
    return completionProvider.resolveCompletion(item);
  } catch (error) {
    logError('Error resolving completion', error);
    return item;
  }
});

connection.onDefinition(async (params: TextDocumentPositionParams): Promise<Definition | null> => {
  try {
    logInfo(
      `Definition requested at ${params.textDocument.uri}:${params.position.line}:${params.position.character}`
    );
    return definitionProvider.provideDefinition(params);
  } catch (error) {
    logError('Error providing definition', error);
    return null;
  }
});

connection.onReferences(async (params: ReferenceParams): Promise<Location[] | null> => {
  try {
    logInfo(
      `References requested at ${params.textDocument.uri}:${params.position.line}:${params.position.character}`
    );
    return referenceProvider.provideReferences(params);
  } catch (error) {
    logError('Error providing references', error);
    return null;
  }
});

connection.onRenameRequest(async (params: RenameParams): Promise<WorkspaceEdit | null> => {
  try {
    logInfo(
      `Rename requested at ${params.textDocument.uri}:${params.position.line}:${params.position.character} to "${params.newName}"`
    );
    return renameProvider.provideRename(params);
  } catch (error) {
    logError('Error providing rename', error);
    return null;
  }
});

connection.onPrepareRename(
  async (
    params: TextDocumentPositionParams
  ): Promise<{
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
    placeholder: string;
  } | null> => {
    try {
      logInfo(
        `Prepare rename requested at ${params.textDocument.uri}:${params.position.line}:${params.position.character}`
      );
      return renameProvider.prepareRename(params);
    } catch (error) {
      logError('Error preparing rename', error);
      return null;
    }
  }
);

connection.onHover(async (params: TextDocumentPositionParams): Promise<Hover | null> => {
  try {
    logInfo(
      `Hover requested at ${params.textDocument.uri}:${params.position.line}:${params.position.character}`
    );
    return hoverProvider.provideHover(params);
  } catch (error) {
    logError('Error providing hover', error);
    return null;
  }
});

connection.onDocumentSymbol(
  async (params: DocumentSymbolParams): Promise<DocumentSymbol[] | null> => {
    try {
      logInfo(`Document symbols requested for ${params.textDocument.uri}`);
      return documentSymbolProvider.provideDocumentSymbols(params);
    } catch (error) {
      logError('Error providing document symbols', error);
      return null;
    }
  }
);

connection.onCodeAction(async (params: CodeActionParams): Promise<CodeAction[] | null> => {
  try {
    logInfo(`Code actions requested for ${params.textDocument.uri}`);
    return codeActionProvider.provideCodeActions(params);
  } catch (error) {
    logError('Error providing code actions', error);
    return null;
  }
});

connection.onDidChangeConfiguration(change => {
  logInfo('Configuration changed');

  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentManager.updateConfiguration(change.settings.extremexp || {});
    logInfo('Document manager configuration updated');
  }

  // Revalidate all open text documents
  const openDocuments = documents.all();
  logInfo(`Revalidating ${openDocuments.length} open documents`);
  openDocuments.forEach(document => {
    diagnosticProvider.validateDocument(document);
  });
});

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
logInfo('Starting to listen for client connections...');
connection.listen();
