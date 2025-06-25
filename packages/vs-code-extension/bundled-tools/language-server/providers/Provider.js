import { PositionUtils } from '../utils/PositionUtils.js';
export class Provider {
    documentManager;
    connection;
    initialize(connection, documentManager) {
        this.connection = connection;
        this.documentManager = documentManager;
    }
    getDocumentAndPosition(textDocument, position) {
        const document = this.documentManager?.getDocument(textDocument.uri);
        if (!document || document.rootParseTree === undefined || document.tokenStream === undefined)
            return undefined;
        const tokenPosition = PositionUtils.getCurrentPosition(document.rootParseTree, document.tokenStream, position);
        if (tokenPosition === undefined)
            return undefined;
        return [document, tokenPosition];
    }
}
//# sourceMappingURL=Provider.js.map