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

  // Initialize all components
  workspaceManager = new WorkspaceManager(params.workspaceFolders || []);
  documentManager = new DocumentManager(workspaceManager);
  diagnosticProvider = new DiagnosticProvider(
    connection,
    documentManager,
    hasDiagnosticRelatedInformationCapability
  );
  completionProvider = new CompletionProvider(documentManager);
  definitionProvider = new DefinitionProvider(documentManager);
  referenceProvider = new ReferenceProvider(documentManager);
  renameProvider = new RenameProvider(documentManager);
  hoverProvider = new HoverProvider(documentManager);
  documentSymbolProvider = new DocumentSymbolProvider(documentManager);
  codeActionProvider = new CodeActionProvider(documentManager);

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

  return result;
});

connection.onInitialized(() => {
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(event => {
      workspaceManager.updateWorkspaceFolders({ event });
    });
  }
});

// Document change handlers
documents.onDidOpen(event => {
  documentManager.openDocument(event.document);
  diagnosticProvider.validateDocument(event.document);
});

documents.onDidChangeContent(event => {
  documentManager.updateDocument(event.document);
  diagnosticProvider.validateDocument(event.document);
});

documents.onDidClose(event => {
  documentManager.closeDocument(event.document.uri);
  connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

// Feature handlers
connection.onCompletion(async (params: TextDocumentPositionParams): Promise<CompletionItem[]> => {
  return completionProvider.provideCompletions(params);
});

connection.onCompletionResolve(async (item: CompletionItem): Promise<CompletionItem> => {
  return completionProvider.resolveCompletion(item);
});

connection.onDefinition(async (params: TextDocumentPositionParams): Promise<Definition | null> => {
  return definitionProvider.provideDefinition(params);
});

connection.onReferences(async (params: ReferenceParams): Promise<Location[] | null> => {
  return referenceProvider.provideReferences(params);
});

connection.onRenameRequest(async (params: RenameParams): Promise<WorkspaceEdit | null> => {
  return renameProvider.provideRename(params);
});

connection.onPrepareRename(
  async (
    params: TextDocumentPositionParams
  ): Promise<{ range: any; placeholder: string } | null> => {
    return renameProvider.prepareRename(params);
  }
);

connection.onHover(async (params: TextDocumentPositionParams): Promise<Hover | null> => {
  return hoverProvider.provideHover(params);
});

connection.onDocumentSymbol(
  async (params: DocumentSymbolParams): Promise<DocumentSymbol[] | null> => {
    return documentSymbolProvider.provideDocumentSymbols(params);
  }
);

connection.onCodeAction(async (params: CodeActionParams): Promise<CodeAction[] | null> => {
  return codeActionProvider.provideCodeActions(params);
});

connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentManager.updateConfiguration(change.settings.extremexp || {});
  }

  // Revalidate all open text documents
  documents.all().forEach(document => {
    diagnosticProvider.validateDocument(document);
  });
});

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();
