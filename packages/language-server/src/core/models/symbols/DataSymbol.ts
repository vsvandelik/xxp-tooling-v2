import { Document } from '../../documents/Document.js';
import { TerminalSymbolWithReferences } from './TerminalSymbolWithReferences.js';

export class DataSymbol extends TerminalSymbolWithReferences {
  constructor(
    name: string,
    document: Document,
    public schemaFilePath?: string
  ) {
    super(name, document);
  }
}
