import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  AbstractParseTreeVisitor,
  CharStream,
  CommonTokenStream,
  Lexer,
  Parser,
  ParseTree,
  Token,
} from 'antlr4ng';
import { DocumentManager } from '../../core/managers/DocumentsManager.js';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { DiagnosticReportingErrorListener } from './DiagnosticReportingErrorListener.js';
import { Logger } from '../../utils/Logger.js';
import { DocumentSymbolTable } from '../symbolTable/DocumentSymbolTable.js';
import { XxpSymbolTableBuilder } from '../symbolTable/builders/XxpSymbolTableBuilder.js';
import { XxpDocument } from '../../core/documents/XxpDocument.js';
import { EspaceDocument } from '../../core/documents/EspaceDocument.js';
import { Document } from '../../core/documents/Document.js';
import { WorkflowSymbol } from '../../core/models/symbols/WorkflowSymbol.js';
import { ESPACELexer, ESPACEParser, XXPLexer, XXPParser } from '@extremexp/core';
import { EspaceSymbolTableBuilder } from '../symbolTable/builders/EspaceSymbolTableBuilder.js';

export class DocumentParser {
  private logger = Logger.getLogger();

  constructor(protected documentsManager: DocumentManager) {}

  public parseDocument(
    textDocument: TextDocument,
    parsedDocument: Document,
    forcedFsParsing: boolean = false
  ): void {
    if (parsedDocument instanceof XxpDocument) {
      this.parseXxpDocument(textDocument, parsedDocument, forcedFsParsing);
    } else if (parsedDocument instanceof EspaceDocument) {
      this.parseEspaceDocument(textDocument, parsedDocument, forcedFsParsing);
    }
  }

  private parseDocumentHelper(
    textDocument: TextDocument,
    parsedDocument: Document,
    getLexer: (input: CharStream) => Lexer,
    getParser: (tokenStream: CommonTokenStream) => Parser,
    getRootParseTree: (parser: Parser) => ParseTree,
    getSymbolTableBuilder: (
      documentsManager: DocumentManager,
      document: Document,
      symbolTable: DocumentSymbolTable
    ) => AbstractParseTreeVisitor<DocumentSymbolTable>,
    extraContentErrorMessage: string,
    forcedFsParsing: boolean
  ): Document | undefined {
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

    this.checkForExtraContent(
      parsedDocument.tokenStream,
      extraContentErrorMessage,
      parsedDocument.diagnostics,
      textDocument
    );

    const folderSymbolTable = this.documentsManager.getDocumentSymbolTableForFile(textDocument.uri);

    try {
      const symbolTableBuilder = getSymbolTableBuilder(
        this.documentsManager,
        parsedDocument,
        folderSymbolTable
      );
      const symbolTable = symbolTableBuilder.visit(parsedDocument.rootParseTree);
      if (!symbolTable) {
        this.logger.error('Symbol table is null');
        return;
      }
      parsedDocument.symbolTable = symbolTable;
      parsedDocument.workflowSymbolTable = symbolTable.children.find(
        c => c instanceof WorkflowSymbol && c.document === parsedDocument
      ) as WorkflowSymbol;
    } catch (error) {
      this.logger.error(`Error building symbol table: ${error}`);
    }

    return parsedDocument;
  }

  private parseXxpDocument(
    textDocument: TextDocument,
    parsedDocument: Document,
    forcedFsParsing: boolean
  ): void {
    this.parseDocumentHelper(
      textDocument,
      parsedDocument,
      input => new XXPLexer(input),
      tokenStream => new XXPParser(tokenStream),
      parser => (parser as XXPParser).program(),
      (documentsManager, document, symbolTable) =>
        new XxpSymbolTableBuilder(documentsManager, document, symbolTable),
      'Extra content found after the end of the workflow declaration.',
      forcedFsParsing
    );
  }

  private parseEspaceDocument(
    textDocument: TextDocument,
    parsedDocument: Document,
    forcedFsParsing: boolean
  ): void {
    console.error(`[PARSER] PARSING-ESPACE-DOC: ${textDocument.uri}`);
    this.parseDocumentHelper(
      textDocument,
      parsedDocument,
      input => new ESPACELexer(input),
      tokenStream => new ESPACEParser(tokenStream),
      parser => (parser as ESPACEParser).program(),
      (documentsManager, document, symbolTable) => {
        console.error(`[PARSER] CREATING-ESPACE-BUILDER: ${document.uri}`);
        return new EspaceSymbolTableBuilder(documentsManager, document, symbolTable);
      },
      'Extra content found after the end of the experiment space declaration.',
      forcedFsParsing
    );
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
