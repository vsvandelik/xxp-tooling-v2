import { Connection, Position, TextDocumentIdentifier } from 'vscode-languageserver';
import { DocumentManager } from '../core/managers/DocumentsManager';
import { Document } from '../core/documents/Document';
import { PositionUtils } from '../utils/PositionUtils';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { TokenPosition } from '../core/models/TokenPosition';

export abstract class Provider {
	protected documentManager?: DocumentManager;
	protected connection?: Connection;

	initialize(connection: Connection, documentManager: DocumentManager): void {
		this.connection = connection;
		this.documentManager = documentManager;
	}

	protected getDocumentAndPosition(textDocument: TextDocumentIdentifier, position: Position): [Document, TokenPosition] | undefined {
		const document = this.documentManager?.getDocument(textDocument.uri);
		if (!document || document.rootParseTree === undefined || document.tokenStream === undefined) return undefined;

		const tokenPosition = PositionUtils.getCurrentPosition(document.rootParseTree, document.tokenStream, position);
		if (tokenPosition === undefined) return undefined;

		return [document, tokenPosition];
	}

	abstract addHandlers(): void;
}