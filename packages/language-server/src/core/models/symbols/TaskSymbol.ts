import { Document } from '../../documents/Document.js';
import { TerminalSymbolWithReferences } from './TerminalSymbolWithReferences.js';
import { WorkflowSymbol } from './WorkflowSymbol.js';

export class TaskSymbol extends TerminalSymbolWithReferences {
  constructor(
    name: string,
    document: Document,
    public implementation?: WorkflowSymbol | string,
    public params: string[] = []
  ) {
    super(name, document);
  }
}
