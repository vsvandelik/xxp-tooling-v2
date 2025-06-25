import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentManager } from '../../core/managers/DocumentsManager.js';
import { Document } from '../../core/documents/Document.js';
export declare class DocumentParser {
    protected documentsManager: DocumentManager;
    private logger;
    constructor(documentsManager: DocumentManager);
    parseDocument(textDocument: TextDocument, parsedDocument: Document, forcedFsParsing?: boolean): void;
    private parseDocumentHelper;
    private parseXxpDocument;
    private parseEspaceDocument;
    private checkForExtraContent;
}
//# sourceMappingURL=DocumentParser.d.ts.map