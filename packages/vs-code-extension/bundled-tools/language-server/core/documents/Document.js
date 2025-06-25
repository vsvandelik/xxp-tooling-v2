import { Logger } from '../../utils/Logger.js';
export class Document {
    uri;
    documentParser;
    logger = Logger.getLogger();
    documentsThisDependsOn = new Set();
    documentsDependingOnThis = new Set();
    symbolTable;
    workflowSymbolTable;
    diagnostics;
    documentVersion = -1;
    lexer;
    parser;
    rootParseTree;
    tokenStream;
    codeCompletionCore;
    forcedFsParsing;
    constructor(uri, documentParser) {
        this.uri = uri;
        this.documentParser = documentParser;
    }
    updateDocument(textDocument) {
        if (this.documentVersion === textDocument.version) {
            this.logger.info(`Document version unchanged: ${this.uri}`);
            return;
        }
        this.documentVersion = textDocument.version;
        try {
            this.documentParser.parseDocument(textDocument, this, this.forcedFsParsing);
            this.logger.info(`Document parsed successfully: ${this.uri}`);
        }
        catch (error) {
            this.logger.error(`Error updating document: ${error}`);
        }
    }
    static addDocumentDependency(thisDependsOn, dependingOnThis) {
        if (!thisDependsOn || !dependingOnThis) {
            throw new Error('Cannot add document dependency: one of the documents is null or undefined');
        }
        if (![...thisDependsOn.documentsThisDependsOn].some(doc => doc.uri === dependingOnThis.uri)) {
            thisDependsOn.documentsThisDependsOn.add(dependingOnThis);
        }
        if (![...dependingOnThis.documentsDependingOnThis].some(doc => doc.uri === thisDependsOn.uri)) {
            dependingOnThis.documentsDependingOnThis.add(thisDependsOn);
        }
    }
}
//# sourceMappingURL=Document.js.map