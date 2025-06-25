import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentSymbolTable } from '../../language/symbolTable/DocumentSymbolTable.js';
import { Document } from '../documents/Document.js';
export declare class DocumentManager {
    private readonly parsedDocuments;
    private readonly symbolTablesBasedOnFolders;
    private readonly logger;
    private readonly documentParser;
    onDocumentOpened(document: TextDocument): Promise<void>;
    onDocumentChanged(document: TextDocument): Promise<void>;
    onDocumentSaved(document: TextDocument): Promise<void>;
    onDocumentClosed(document: TextDocument): void;
    private parseAndUpdateDocument;
    private refreshDocument;
    private addNewDocument;
    private cleanupDocumentDependencies;
    private cleanupDocumentSymbols;
    private removeDocumentSymbolsFromTable;
    private symbolBelongsToDocument;
    private getDocumentsInFolder;
    getDocument(uri: string): Document | undefined;
    getDocumentAndLoadIfNecessary(uri: string): Document | undefined;
    getDocumentSymbolTableForFile(uri: string): DocumentSymbolTable;
    private unloadUnnecessaryDocuments;
    private loadDocumentDirectlyWithFileSystem;
}
//# sourceMappingURL=DocumentsManager.d.ts.map