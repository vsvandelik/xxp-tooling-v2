import { CommonTokenStream, Lexer, Parser, ParseTree } from 'antlr4ng';
import { Diagnostic } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentParser } from '../../language/parsing/DocumentParser.js';
import { DocumentSymbolTable } from '../../language/symbolTable/DocumentSymbolTable.js';
import { Logger } from '../../utils/Logger.js';
import { WorkflowSymbol } from '../models/symbols/WorkflowSymbol.js';
import { CodeCompletionCore } from 'antlr4-c3';

export abstract class Document {
  private logger = Logger.getLogger();

  public documentsThisDependsOn = new Set<Document>();
  public documentsDependingOnThis = new Set<Document>();
  public symbolTable?: DocumentSymbolTable;
  public workflowSymbolTable?: WorkflowSymbol;

  public diagnostics?: Diagnostic[];
  public documentVersion: number = -1;
  public lexer?: Lexer;
  public parser?: Parser;
  public rootParseTree?: ParseTree;
  public tokenStream?: CommonTokenStream;
  public codeCompletionCore?: CodeCompletionCore;
  public forcedFsParsing?: boolean;

  constructor(
    public readonly uri: string,
    private readonly documentParser: DocumentParser
  ) {}

  public updateDocument(textDocument: TextDocument): void {
    if (this.documentVersion === textDocument.version) {
      this.logger.info(`Document version unchanged: ${this.uri}`);
      return;
    }

    this.documentVersion = textDocument.version;
    try {
      this.documentParser.parseDocument(textDocument, this, this.forcedFsParsing);
      this.logger.info(`Document parsed successfully: ${this.uri}`);
    } catch (error) {
      this.logger.error(`Error updating document: ${error}`);
    }
  }

  public static addDocumentDependency(thisDependsOn: Document, dependingOnThis: Document): void {
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
