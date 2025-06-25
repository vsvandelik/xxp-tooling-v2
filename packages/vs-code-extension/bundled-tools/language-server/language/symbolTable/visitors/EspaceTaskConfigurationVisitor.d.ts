import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import { EspaceTaskConfigurationContext, EspaceParamAssignmentContext } from '@extremexp/core';
export declare class EspaceTaskConfigurationVisitor {
    private readonly builder;
    constructor(builder: EspaceSymbolTableBuilder);
    visitConfiguration(ctx: EspaceTaskConfigurationContext): DocumentSymbolTable;
    visitParamAssignment(ctx: EspaceParamAssignmentContext): DocumentSymbolTable;
    private getTaskSymbolByName;
    private getReferencedWorkflowSymbol;
}
//# sourceMappingURL=EspaceTaskConfigurationVisitor.d.ts.map