import { SymbolTable } from 'antlr4-c3';
import { Document } from '../../documents/Document.js';
import { TerminalSymbolReference } from '../TerminalSymbolReference.js';
import { TerminalNode } from 'antlr4ng';
export declare class ExperimentSymbol extends SymbolTable {
    document: Document;
    references: TerminalSymbolReference[];
    constructor(name: string, document: Document);
    clear(): void;
    addReference(symbol: TerminalNode, document: Document): void;
}
//# sourceMappingURL=ExperimentSymbol.d.ts.map