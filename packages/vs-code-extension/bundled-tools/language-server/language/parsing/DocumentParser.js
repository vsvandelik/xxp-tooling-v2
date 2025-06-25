import { CharStream, CommonTokenStream, Token, } from 'antlr4ng';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { DiagnosticReportingErrorListener } from './DiagnosticReportingErrorListener.js';
import { Logger } from '../../utils/Logger.js';
import { XxpSymbolTableBuilder } from '../symbolTable/builders/XxpSymbolTableBuilder.js';
import { XxpDocument } from '../../core/documents/XxpDocument.js';
import { EspaceDocument } from '../../core/documents/EspaceDocument.js';
import { WorkflowSymbol } from '../../core/models/symbols/WorkflowSymbol.js';
import { ESPACELexer, ESPACEParser, XXPLexer, XXPParser } from '@extremexp/core';
import { EspaceSymbolTableBuilder } from '../symbolTable/builders/EspaceSymbolTableBuilder.js';
export class DocumentParser {
    documentsManager;
    logger = Logger.getLogger();
    constructor(documentsManager) {
        this.documentsManager = documentsManager;
    }
    parseDocument(textDocument, parsedDocument, forcedFsParsing = false) {
        if (parsedDocument instanceof XxpDocument) {
            this.parseXxpDocument(textDocument, parsedDocument, forcedFsParsing);
        }
        else if (parsedDocument instanceof EspaceDocument) {
            this.parseEspaceDocument(textDocument, parsedDocument, forcedFsParsing);
        }
    }
    parseDocumentHelper(textDocument, parsedDocument, getLexer, getParser, getRootParseTree, getSymbolTableBuilder, extraContentErrorMessage, forcedFsParsing) {
        const input = CharStream.fromString(textDocument.getText());
        parsedDocument.diagnostics = [];
        const diagnosticListener = new DiagnosticReportingErrorListener(parsedDocument.diagnostics);
        parsedDocument.forcedFsParsing = forcedFsParsing;
        parsedDocument.lexer = getLexer(input);
        parsedDocument.lexer.removeErrorListeners();
        parsedDocument.lexer.addErrorListener(diagnosticListener);
        parsedDocument.tokenStream = new CommonTokenStream(parsedDocument.lexer);
        parsedDocument.parser = getParser(parsedDocument.tokenStream);
        parsedDocument.parser.removeErrorListeners();
        parsedDocument.parser.addErrorListener(diagnosticListener);
        parsedDocument.rootParseTree = getRootParseTree(parsedDocument.parser);
        parsedDocument.codeCompletionCore = undefined;
        this.checkForExtraContent(parsedDocument.tokenStream, extraContentErrorMessage, parsedDocument.diagnostics, textDocument);
        const folderSymbolTable = this.documentsManager.getDocumentSymbolTableForFile(textDocument.uri);
        try {
            const symbolTableBuilder = getSymbolTableBuilder(this.documentsManager, parsedDocument, folderSymbolTable);
            const symbolTable = symbolTableBuilder.visit(parsedDocument.rootParseTree);
            if (!symbolTable) {
                this.logger.error('Symbol table is null');
                return;
            }
            parsedDocument.symbolTable = symbolTable;
            parsedDocument.workflowSymbolTable = symbolTable.children.find(c => c instanceof WorkflowSymbol && c.document === parsedDocument);
        }
        catch (error) {
            this.logger.error(`Error building symbol table: ${error}`);
        }
        return parsedDocument;
    }
    parseXxpDocument(textDocument, parsedDocument, forcedFsParsing) {
        this.parseDocumentHelper(textDocument, parsedDocument, input => new XXPLexer(input), tokenStream => new XXPParser(tokenStream), parser => parser.program(), (documentsManager, document, symbolTable) => new XxpSymbolTableBuilder(documentsManager, document, symbolTable), 'Extra content found after the end of the workflow declaration.', forcedFsParsing);
    }
    parseEspaceDocument(textDocument, parsedDocument, forcedFsParsing) {
        this.parseDocumentHelper(textDocument, parsedDocument, input => new ESPACELexer(input), tokenStream => new ESPACEParser(tokenStream), parser => parser.program(), (documentsManager, document, symbolTable) => new EspaceSymbolTableBuilder(documentsManager, document, symbolTable), 'Extra content found after the end of the experiment space declaration.', forcedFsParsing);
    }
    checkForExtraContent(tokenStream, errorMessage, diagnostics, textDocument) {
        if (tokenStream.LA(1) !== Token.EOF) {
            const offendingToken = tokenStream.LT(1);
            if (!offendingToken)
                return;
            diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: {
                    start: {
                        line: offendingToken.line - 1,
                        character: offendingToken.column,
                    },
                    end: {
                        line: textDocument.lineCount,
                        character: 0,
                    },
                },
                message: errorMessage,
                source: 'XXP',
            });
            this.logger.warn(`Extra content detected in document at line ${offendingToken.line}`);
        }
    }
}
//# sourceMappingURL=DocumentParser.js.map