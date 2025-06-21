import { ParseTree } from 'antlr4ng';
import { SymbolTable, Symbol } from '../analysis/SymbolTable.js';
import { WorkspaceManager } from '../workspace/WorkspaceManager.js';
import { DocumentAnalysis } from '../types/AnalysisTypes.js';
import { XXPAnalyzer } from '../analysis/XXPAnalyzer.js';
import { ESPACEAnalyzer } from '../analysis/ESPACEAnalyzer.js';

export class DocumentAnalyzer {
  private xxpAnalyzer: XXPAnalyzer;
  private espaceAnalyzer: ESPACEAnalyzer;

  constructor(
    private symbolTable: SymbolTable,
    private workspaceManager: WorkspaceManager
  ) {
    this.xxpAnalyzer = new XXPAnalyzer();
    this.espaceAnalyzer = new ESPACEAnalyzer();
  }

  analyze(
    parseTree: ParseTree,
    uri: string,
    languageId: string
  ): DocumentAnalysis {
    if (languageId === 'xxp') {
      return this.xxpAnalyzer.analyze(parseTree, uri);
    } else if (languageId === 'espace') {
      return this.espaceAnalyzer.analyze(parseTree, uri);
    }

    throw new Error(`Unsupported language: ${languageId}`);
  }
}