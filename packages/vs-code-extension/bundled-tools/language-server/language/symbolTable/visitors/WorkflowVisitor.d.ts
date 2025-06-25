import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import { XxpWorkflowHeaderContext, XxpWorkflowBodyContext } from '@extremexp/core';
export declare class WorkflowVisitor {
    private readonly builder;
    constructor(builder: XxpSymbolTableBuilder);
    visitHeader(ctx: XxpWorkflowHeaderContext): DocumentSymbolTable;
    visitBody(ctx: XxpWorkflowBodyContext): DocumentSymbolTable;
    private getExistingWorkflowSymbolTable;
    private linkParentWorkflowSymbol;
    private getParentWorkflowDocument;
    private verifyWorkflowNameFileNameMatch;
}
//# sourceMappingURL=WorkflowVisitor.d.ts.map