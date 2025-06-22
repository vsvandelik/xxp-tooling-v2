import { Connection, Position, TextDocumentIdentifier } from 'vscode-languageserver';
import { DocumentManager } from '../core/managers/DocumentManager.js';
import { Document } from '../core/documents/Document.js';
import { PositionUtils } from '../utils/PositionUtils.js';
import { TokenPosition } from '../core/types/Position.js';

export abstract class Provider {
    protected documentManager?: DocumentManager;
    protected connection?: Connection;

    public initialize(connection: Connection, documentManager: DocumentManager): void {
        this.connection = connection;
        this.documentManager = documentManager;
    }

    protected getDocumentAndPosition(textDocument: TextDocumentIdentifier, position: Position): [Document, TokenPosition] | undefined {
        const document = this.documentManager?.getDocument(textDocument.uri);
        if (!document || !document.rootParseTree || !document.tokenStream) return undefined;

        const tokenPosition = PositionUtils.getCurrentPosition(document.rootParseTree, document.tokenStream, position);
        if (!tokenPosition) return undefined;

        return [document, tokenPosition];
    }

    public abstract addHandlers(): void;
}