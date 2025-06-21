// packages/language-server/src/documents/DocumentManager.ts
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CharStream, CommonTokenStream, ParseTree } from 'antlr4ng';
import { XXPLexer, XXPParser, ESPACELexer, ESPACEParser } from '@extremexp/core';
import { DocumentSymbols } from './DocumentSymbols.js';
import { DocumentAnalyzer } from './DocumentAnalyzer.js';
import { WorkspaceManager } from '../workspace/WorkspaceManager.js';
import { SymbolTable } from '../analysis/SymbolTable.js';
import { ParsedDocument } from '../types/ParsedDocument.js';
import { ErrorListener } from '../utils/ErrorListener.js';
import { Diagnostic } from 'vscode-languageserver/node.js';

export class DocumentManager {
  private documents: Map<string, ParsedDocument> = new Map();
  private symbolTable: SymbolTable;
  private workspaceManager: WorkspaceManager;
  private configuration: any = {};

  constructor(workspaceManager: WorkspaceManager) {
    this.workspaceManager = workspaceManager;
    this.symbolTable = new SymbolTable(workspaceManager);
  }

  openDocument(document: TextDocument): void {
    this.parseDocument(document);
  }

  updateDocument(document: TextDocument): void {
    this.parseDocument(document);
  }

  closeDocument(uri: string): void {
    this.documents.delete(uri);
    this.symbolTable.removeDocument(uri);
  }

  getDocument(uri: string): ParsedDocument | undefined {
    return this.documents.get(uri);
  }

  getAllDocuments(): ParsedDocument[] {
    return Array.from(this.documents.values());
  }

  getSymbolTable(): SymbolTable {
    return this.symbolTable;
  }

  updateConfiguration(config: any): void {
    this.configuration = config;
  }

  private parseDocument(document: TextDocument): void {
    const uri = document.uri;
    const text = document.getText();
    const languageId = document.languageId;

    // Clear previous diagnostics
    const diagnostics: Diagnostic[] = [];
    const errorListener = new ErrorListener(diagnostics);

    try {
      let parseTree: ParseTree | null = null;
      let tokens: CommonTokenStream | null = null;

      if (languageId === 'xxp') {
        const result = this.parseXXP(text, errorListener);
        parseTree = result.tree;
        tokens = result.tokens;
      } else if (languageId === 'espace') {
        const result = this.parseESPACE(text, errorListener);
        parseTree = result.tree;
        tokens = result.tokens;
      }

      if (parseTree && tokens) {
        // Create document symbols
        const symbols = new DocumentSymbols();
        const documentSymbols = symbols.extractSymbols(parseTree, languageId);

        // Analyze document
        const analyzer = new DocumentAnalyzer(this.symbolTable, this.workspaceManager);
        const analysis = analyzer.analyze(parseTree, uri, languageId);

        // Store parsed document
        const parsedDocument: ParsedDocument = {
          uri,
          document,
          languageId,
          parseTree,
          tokens,
          symbols: documentSymbols,
          analysis,
          diagnostics,
        };

        this.documents.set(uri, parsedDocument);

        // Update symbol table
        this.symbolTable.updateDocument(uri, analysis.symbols, analysis.imports);

        // Trigger re-analysis of dependent documents
        this.reanalyzeDependents(uri);
      }
    } catch (error) {
      console.error(`Error parsing document ${uri}:`, error);
      diagnostics.push({
        severity: 1, // Error
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
        message: `Failed to parse document: ${error}`,
        source: 'extremexp',
      });
    }

    // Store document with diagnostics even if parsing failed
    if (!this.documents.has(uri)) {
      this.documents.set(uri, {
        uri,
        document,
        languageId,
        parseTree: null,
        tokens: null,
        symbols: [],
        analysis: null,
        diagnostics,
      });
    }
  }

  private parseXXP(
    text: string,
    errorListener: ErrorListener
  ): { tree: ParseTree; tokens: CommonTokenStream } {
    const inputStream = CharStream.fromString(text);
    const lexer = new XXPLexer(inputStream);
    lexer.removeErrorListeners();
    lexer.addErrorListener(errorListener);

    const tokenStream = new CommonTokenStream(lexer);
    const parser = new XXPParser(tokenStream);
    parser.removeErrorListeners();
    parser.addErrorListener(errorListener);

    const tree = parser.program();
    return { tree, tokens: tokenStream };
  }

  private parseESPACE(
    text: string,
    errorListener: ErrorListener
  ): { tree: ParseTree; tokens: CommonTokenStream } {
    const inputStream = CharStream.fromString(text);
    const lexer = new ESPACELexer(inputStream);
    lexer.removeErrorListeners();
    lexer.addErrorListener(errorListener);

    const tokenStream = new CommonTokenStream(lexer);
    const parser = new ESPACEParser(tokenStream);
    parser.removeErrorListeners();
    parser.addErrorListener(errorListener);

    const tree = parser.program();
    return { tree, tokens: tokenStream };
  }

  private reanalyzeDependents(uri: string): void {
    const dependents = this.symbolTable.getDependents(uri);
    for (const dependentUri of dependents) {
      const document = this.documents.get(dependentUri);
      if (document) {
        this.parseDocument(document.document);
      }
    }
  }

  // Utility methods for providers
  getTokenAtPosition(uri: string, line: number, character: number): any | null {
    const doc = this.documents.get(uri);
    if (!doc || !doc.tokens) return null;

    const tokens = doc.tokens.getTokens();
    for (const token of tokens) {
      if (token.line === line + 1) {
        // ANTLR lines are 1-based
        const start = token.column;
        const end = start + (token.text?.length || 0);
        if (character >= start && character <= end) {
          return token;
        }
      }
    }
    return null;
  }

  getNodeAtPosition(uri: string, line: number, character: number): ParseTree | null {
    const doc = this.documents.get(uri);
    if (!doc || !doc.parseTree) return null;

    // TODO: Implement tree traversal to find node at position
    // This is a simplified version - you'd want a more sophisticated implementation
    const visitor = new PositionVisitor(line, character);
    return visitor.findNode(doc.parseTree);
  }
}

// Helper class to find nodes at specific positions
class PositionVisitor {
  constructor(
    private line: number,
    private character: number
  ) {}

  findNode(tree: ParseTree): ParseTree | null {
    // TODO: Implementation would traverse the tree and find the most specific node
    // at the given position. This is a placeholder.
    return tree;
  }
}
