import { Document } from '../../documents/Document';
import { TerminalSymbolWithReferences } from './TerminalSymbolWithReferences';

export class DataSymbol extends TerminalSymbolWithReferences {
	constructor(name: string, document: Document, public schemaFilePath?: string) {
		super(name, document);
	}
}