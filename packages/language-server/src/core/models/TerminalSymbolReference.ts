import { TerminalNode } from 'antlr4ng';

import { Document } from '../documents/Document.js';

export class TerminalSymbolReference {
  constructor(
    public node: TerminalNode,
    public document: Document
  ) {}
}
