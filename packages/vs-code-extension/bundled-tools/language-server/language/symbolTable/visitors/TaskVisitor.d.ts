import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import { XxpTaskConfigurationContext, XxpParamAssignmentContext, XxpTaskDefinitionContext, XxpImplementationContext, XxpInputStatementContext, XxpOutputStatementContext } from '@extremexp/core';
export declare class TaskVisitor {
    private readonly builder;
    constructor(builder: XxpSymbolTableBuilder);
    visitDefinition(ctx: XxpTaskDefinitionContext): DocumentSymbolTable;
    visitConfiguration(ctx: XxpTaskConfigurationContext): DocumentSymbolTable;
    visitImplementation(ctx: XxpImplementationContext): DocumentSymbolTable;
    visitParam(ctx: XxpParamAssignmentContext): DocumentSymbolTable;
    visitInput(ctx: XxpInputStatementContext): DocumentSymbolTable;
    visitOutput(ctx: XxpOutputStatementContext): DocumentSymbolTable;
    private getTaskSymbolByName;
    private getTaskSymbolFromCurrentScope;
}
//# sourceMappingURL=TaskVisitor.d.ts.map