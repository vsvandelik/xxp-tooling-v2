import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import { EspaceWorkflowNameReadContext, EspaceTaskNameReadContext, EspaceSpaceNameReadContext } from '@extremexp/core';
export declare class EspaceVariableReadVisitor {
    private readonly builder;
    constructor(builder: EspaceSymbolTableBuilder);
    visitWorkflow(ctx: EspaceWorkflowNameReadContext): DocumentSymbolTable;
    visitTask(ctx: EspaceTaskNameReadContext): DocumentSymbolTable;
    visitSpace(ctx: EspaceSpaceNameReadContext): DocumentSymbolTable;
    private visitSymbolRead;
    private getReferencedWorkflowSymbol;
}
//# sourceMappingURL=EspaceVariableReadVisitor.d.ts.map