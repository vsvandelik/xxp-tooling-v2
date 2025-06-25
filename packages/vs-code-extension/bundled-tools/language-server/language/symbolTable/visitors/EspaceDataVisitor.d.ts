import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import { EspaceDataDefinitionContext } from '@extremexp/core';
export declare class EspaceDataVisitor {
    private readonly builder;
    constructor(builder: EspaceSymbolTableBuilder);
    visitDefinition(ctx: EspaceDataDefinitionContext): DocumentSymbolTable;
}
//# sourceMappingURL=EspaceDataVisitor.d.ts.map