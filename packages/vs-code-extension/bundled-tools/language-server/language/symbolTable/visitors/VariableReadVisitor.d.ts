import { ReadNameContext } from '../types.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
export declare class VariableReadVisitor {
    private readonly builder;
    constructor(builder: XxpSymbolTableBuilder);
    visitWorkflow(ctx: ReadNameContext): DocumentSymbolTable;
    visitData(ctx: ReadNameContext): DocumentSymbolTable;
    visitTask(ctx: ReadNameContext): DocumentSymbolTable;
    private visitSymbolRead;
}
//# sourceMappingURL=VariableReadVisitor.d.ts.map