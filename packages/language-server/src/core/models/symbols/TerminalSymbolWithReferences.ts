import { BaseSymbol } from 'antlr4-c3';
import { TerminalNode } from 'antlr4ng';

import { Document } from '../../documents/Document.js';
import { TerminalSymbolReference } from '../TerminalSymbolReference.js';

export class TerminalSymbolWithReferences extends BaseSymbol {
  public references: TerminalSymbolReference[] = [];

  constructor(
    name: string,
    public document: Document
  ) {
    super(name);
  }

  addReference(symbol: TerminalNode, document: Document): void {
    this.references.push(new TerminalSymbolReference(symbol, document));
  }
}
