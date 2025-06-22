import { TextDocument } from 'vscode-languageserver-textdocument';
import { ParseTree, CommonTokenStream } from 'antlr4ng';
import { DocumentSymbol, Diagnostic } from 'vscode-languageserver/node.js';
import { DocumentAnalysis } from './AnalysisTypes.js';

export interface ParsedDocument {
  uri: string;
  document: TextDocument;
  languageId: string;
  parseTree: ParseTree | null;
  tokens: CommonTokenStream | null;
  symbols: DocumentSymbol[];
  analysis: DocumentAnalysis | null;
  diagnostics: Diagnostic[];
}
