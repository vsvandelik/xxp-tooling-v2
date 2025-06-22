import { Document } from '../../documents/Document';
import { TerminalSymbolWithReferences } from './TerminalSymbolWithReferences';
import { WorkflowSymbol } from './WorkflowSymbol';

export class TaskSymbol extends TerminalSymbolWithReferences {
	constructor(name: string, document: Document, public implementation?: WorkflowSymbol | string, public params: string[] = []) {
		super(name, document);
	}
}