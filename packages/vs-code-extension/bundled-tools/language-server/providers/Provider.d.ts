import { Connection, Position, TextDocumentIdentifier } from 'vscode-languageserver';
import { DocumentManager } from '../core/managers/DocumentsManager.js';
import { Document } from '../core/documents/Document.js';
import { TokenPosition } from '../core/models/TokenPosition.js';
export declare abstract class Provider {
    protected documentManager?: DocumentManager;
    protected connection?: Connection;
    initialize(connection: Connection, documentManager: DocumentManager): void;
    protected getDocumentAndPosition(textDocument: TextDocumentIdentifier, position: Position): [Document, TokenPosition] | undefined;
    abstract addHandlers(): void;
}
//# sourceMappingURL=Provider.d.ts.map