import { BaseSymbol } from 'antlr4-c3';
import { TerminalNode } from 'antlr4ng';
import { Document } from '../../documents/Document.js';
import { TerminalSymbolReference } from '../TerminalSymbolReference.js';
export declare class TerminalSymbolWithReferences extends BaseSymbol {
    document: Document;
    references: TerminalSymbolReference[];
    constructor(name: string, document: Document);
    addReference(symbol: TerminalNode, document: Document): void;
}
//# sourceMappingURL=TerminalSymbolWithReferences.d.ts.map