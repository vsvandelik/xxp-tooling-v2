import { TextDocument } from 'vscode-languageserver-textdocument';
import { Diagnostic } from 'vscode-languageserver';
import { CommonTokenStream, Lexer, Parser, ParseTree } from 'antlr4ng';
import { DocumentSymbolTable } from '../symbols/DocumentSymbolTable.js';

export abstract class Document {
  public uri: string;
  public documentVersion: number = -1;
  public diagnostics: Diagnostic[] = [];
  public lexer?: Lexer;
  public parser?: Parser;
  public tokenStream?: CommonTokenStream;
  public rootParseTree?: ParseTree;
  public symbolTable?: DocumentSymbolTable;
  public dependencies = new Set<Document>();
  public dependents = new Set<Document>();

  constructor(uri: string) {
    this.uri = uri;
  }

  public updateDocument(textDocument: TextDocument): void {
    if (this.documentVersion === textDocument.version) return;
    this.documentVersion = textDocument.version;
    this.parse(textDocument);
  }

  protected abstract parse(textDocument: TextDocument): void;

  public static addDocumentDependency(dependent: Document, dependency: Document): void {
    if (!dependent || !dependency) return;
    dependent.dependencies.add(dependency);
    dependency.dependents.add(dependent);
  }

  public static removeDocumentDependency(dependent: Document, dependency: Document): void {
    dependent.dependencies.delete(dependency);
    dependency.dependents.delete(dependent);
  }
}
