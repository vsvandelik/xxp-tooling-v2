import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import { XxpDataDefinitionContext } from '@extremexp/core';
export declare class DataVisitor {
    private readonly builder;
    constructor(builder: XxpSymbolTableBuilder);
    visitDefinition(ctx: XxpDataDefinitionContext): DocumentSymbolTable;
}
//# sourceMappingURL=DataVisitor.d.ts.map