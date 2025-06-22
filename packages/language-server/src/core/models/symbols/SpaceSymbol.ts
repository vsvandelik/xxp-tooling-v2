import { Document } from '../../documents/Document.js';
import { WorkflowSymbol } from './WorkflowSymbol.js';
import { TerminalSymbolWithReferences } from './TerminalSymbolWithReferences.js';

export class SpaceSymbol extends TerminalSymbolWithReferences {
  constructor(
    name: string,
    document: Document,
    public workflowReference?: WorkflowSymbol,
    public strategy?: string
  ) {
    super(name, document);
  }
}
