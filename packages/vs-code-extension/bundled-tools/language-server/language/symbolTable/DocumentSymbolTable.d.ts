import { BaseSymbol, SymbolTable } from 'antlr4-c3';
import { ParseTree } from 'antlr4ng';
export declare class DocumentSymbolTable extends SymbolTable {
    constructor(name: string);
    getValidSymbolsAtPosition<T extends BaseSymbol>(parseTree: ParseTree, type: new (...args: any[]) => T): Promise<string[]>;
    private static symbolWithContextRecursive;
}
//# sourceMappingURL=DocumentSymbolTable.d.ts.map