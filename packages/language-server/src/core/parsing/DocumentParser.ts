import { TextDocument } from 'vscode-languageserver-textdocument';
import { CharStream, CommonTokenStream, Token } from 'antlr4ng';
import { Document } from '../documents/Document.js';
import { DocumentManager } from '../managers/DocumentManager.js';
import { DiagnosticReportingErrorListener } from './DiagnosticReportingErrorListener.js';
import { XxpSymbolTableBuilder } from '../symbols/builders/XxpSymbolTableBuilder.js';
import { EspaceSymbolTableBuilder } from '../symbols/builders/EspaceSymbolTableBuilder.js';
import { DocumentSymbolTable } from '../symbols/DocumentSymbolTable.js';
import { Logger } from '../../utils/Logger.js';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { XXPLexer, XXPParser, ESPACELexer, ESPACEParser } from '@extremexp/core';

export class DocumentParser {
    private readonly logger = Logger.getInstance();

    constructor(private documentManager: DocumentManager) {}

    public parseXxpDocument(textDocument: TextDocument, document: Document): void {
        this.logger.info(`Parsing XXP document: ${textDocument.uri}`);
        
        const input = CharStream.fromString(textDocument.getText());
        document.diagnostics = [];
        const diagnosticListener = new DiagnosticReportingErrorListener(document.diagnostics);

        try {
            document.lexer = new XXPLexer(input);
            document.lexer.removeErrorListeners();
            document.lexer.addErrorListener(diagnosticListener);

            document.tokenStream = new CommonTokenStream(document.lexer);
            document.parser = new XXPParser(document.tokenStream);
            document.parser.removeErrorListeners();
            document.parser.addErrorListener(diagnosticListener);

            document.rootParseTree = (document.parser as XXPParser).program();

            this.checkForExtraContent(document.tokenStream, 'Extra content found after workflow declaration.', document.diagnostics, textDocument);

            const folderSymbolTable = this.getOrCreateFolderSymbolTable(textDocument.uri);
            const symbolTableBuilder = new XxpSymbolTableBuilder(this.documentManager, document, folderSymbolTable);
            const symbolTable = symbolTableBuilder.visit(document.rootParseTree);
            
            if (symbolTable) {
                document.symbolTable = symbolTable;
            }

            this.logger.debug('XXP document parsed successfully');
        } catch (error) {
            this.logger.error(`Error parsing XXP document: ${error}`);
        }
    }

    public parseEspaceDocument(textDocument: TextDocument, document: Document): void {
        this.logger.info(`Parsing ESPACE document: ${textDocument.uri}`);
        
        const input = CharStream.fromString(textDocument.getText());
        document.diagnostics = [];
        const diagnosticListener = new DiagnosticReportingErrorListener(document.diagnostics);

        try {
            document.lexer = new ESPACELexer(input);
            document.lexer.removeErrorListeners();
            document.lexer.addErrorListener(diagnosticListener);

            document.tokenStream = new CommonTokenStream(document.lexer);
            document.parser = new ESPACEParser(document.tokenStream);
            document.parser.removeErrorListeners();
            document.parser.addErrorListener(diagnosticListener);

            document.rootParseTree = (document.parser as ESPACEParser).program();

            this.checkForExtraContent(document.tokenStream, 'Extra content found after experiment declaration.', document.diagnostics, textDocument);

            const folderSymbolTable = this.getOrCreateFolderSymbolTable(textDocument.uri);
            const symbolTableBuilder = new EspaceSymbolTableBuilder(this.documentManager, document, folderSymbolTable);
            const symbolTable = symbolTableBuilder.visit(document.rootParseTree);
            
            if (symbolTable) {
                document.symbolTable = symbolTable;
            }

            this.logger.debug('ESPACE document parsed successfully');
        } catch (error) {
            this.logger.error(`Error parsing ESPACE document: ${error}`);
        }
    }

    private checkForExtraContent(
        tokenStream: CommonTokenStream,
        errorMessage: string,
        diagnostics: Diagnostic[],
        textDocument: TextDocument
    ): void {
        if (tokenStream.LA(1) !== Token.EOF) {
            const offendingToken = tokenStream.LT(1);
            if (!offendingToken) return;

            diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: {
                    start: {
                        line: offendingToken.line - 1,
                        character: offendingToken.column
                    },
                    end: {
                        line: textDocument.lineCount,
                        character: 0
                    }
                },
                message: errorMessage,
                source: 'DSL'
            });
        }
    }

    private getOrCreateFolderSymbolTable(uri: string): DocumentSymbolTable {
        return this.documentManager.getFolderSymbolTable(uri);
    }
}