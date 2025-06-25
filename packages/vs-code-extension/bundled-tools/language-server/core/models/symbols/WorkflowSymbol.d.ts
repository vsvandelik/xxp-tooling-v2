import { BaseSymbol, SymbolConstructor, SymbolTable } from 'antlr4-c3';
import { Document } from '../../documents/Document.js';
import { TerminalSymbolReference } from '../TerminalSymbolReference.js';
import { TerminalNode } from 'antlr4ng';
export declare class WorkflowSymbol extends SymbolTable {
    document: Document;
    parentWorkflowSymbol?: WorkflowSymbol;
    references: TerminalSymbolReference[];
    constructor(name: string, document: Document);
    clear(): void;
    getSymbolsOfType<T extends BaseSymbol, Args extends unknown[]>(t: SymbolConstructor<T, Args>): Promise<T[]>;
    getNestedSymbolsOfTypeSync<T extends BaseSymbol, Args extends unknown[]>(t: SymbolConstructor<T, Args>): T[];
    getAllNestedSymbols(name?: string): Promise<BaseSymbol[]>;
    getAllNestedSymbolsSync(name?: string): BaseSymbol[];
    getAllSymbols<T extends BaseSymbol, Args extends unknown[]>(t: SymbolConstructor<T, Args>, localOnly?: boolean): Promise<T[]>;
    getAllSymbolsSync<T extends BaseSymbol, Args extends unknown[]>(t: SymbolConstructor<T, Args>, localOnly?: boolean): T[];
    getNestedSymbolsOfType<T extends BaseSymbol, Args extends unknown[]>(t: SymbolConstructor<T, Args>): Promise<T[]>;
    resolve(name: string, localOnly?: boolean): Promise<BaseSymbol | undefined>;
    resolveSync(name: string, localOnly?: boolean): BaseSymbol | undefined;
    addReference(symbol: TerminalNode, document: Document): void;
}
//# sourceMappingURL=WorkflowSymbol.d.ts.map