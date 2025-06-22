import { TerminalNode } from 'antlr4ng';
import { Document } from '../documents/Document';


export class TerminalSymbolReference {
	constructor(public node: TerminalNode, public document: Document) { }
}