import { Document } from '../../documents/Document.js';
import { Param } from '../Param.js';

import { TerminalSymbolWithReferences } from './TerminalSymbolWithReferences.js';
import { WorkflowSymbol } from './WorkflowSymbol.js';

export class TaskSymbol extends TerminalSymbolWithReferences {
  constructor(
    name: string,
    document: Document,
    public implementation?: WorkflowSymbol | string,
    public params: Param[] = [],
    public inputData: string[] = [],
    public outputData: string[] = []
  ) {
    super(name, document);
  }
}
