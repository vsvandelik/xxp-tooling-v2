import { SymbolTable } from 'antlr4-c3';
import { Document } from '../../documents/Document.js';
import { TerminalSymbolReference } from '../TerminalSymbolReference.js';
import { TerminalNode } from 'antlr4ng';

export class ExperimentSymbol extends SymbolTable {
  public references: TerminalSymbolReference[] = [];

  constructor(
    name: string,
    public document: Document
  ) {
    super(name, { allowDuplicateSymbols: false });
  }

  override clear(): void {
    super.clear();
    // Clear document dependencies
    for (const document of this.document.documentsThisDependsOn) {
      for (const dependingDoc of document.documentsDependingOnThis) {
        if (dependingDoc.uri === this.document.uri) {
          document.documentsDependingOnThis.delete(dependingDoc);
          break;
        }
      }
    }
    this.document.documentsThisDependsOn.clear();
  }

  addReference(symbol: TerminalNode, document: Document): void {
    this.references.push(new TerminalSymbolReference(symbol, document));
  }
}
