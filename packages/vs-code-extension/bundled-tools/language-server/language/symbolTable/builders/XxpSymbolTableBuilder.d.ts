import { AbstractParseTreeVisitor } from 'antlr4ng';
import { DocumentManager } from '../../../core/managers/DocumentsManager.js';
import { Logger } from '../../../utils/Logger.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { ScopedSymbol } from 'antlr4-c3';
import { Document } from '../../../core/documents/Document.js';
import { XXPVisitor } from '@extremexp/core';
import { XxpDataDefinitionContext, XxpTaskConfigurationContext, XxpParamAssignmentContext, XxpWorkflowNameReadContext, XxpTaskNameReadContext, XxpWorkflowHeaderContext, XxpWorkflowBodyContext, XxpTaskDefinitionContext, XxpImplementationContext, XxpInputStatementContext, XxpOutputStatementContext, XxpDataNameReadContext, XxpFileNameStringContext } from '@extremexp/core';
export declare class XxpSymbolTableBuilder extends AbstractParseTreeVisitor<DocumentSymbolTable> implements XXPVisitor<DocumentSymbolTable> {
    readonly documentsManager: DocumentManager;
    readonly document: Document;
    readonly symbolTable: DocumentSymbolTable;
    readonly logger: Logger;
    currentScope: ScopedSymbol;
    private readonly workflowVisitor;
    private readonly dataVisitor;
    private readonly taskVisitor;
    private readonly variableReadVisitor;
    private readonly fileVisitor;
    constructor(documentsManager: DocumentManager, document: Document, symbolTable: DocumentSymbolTable);
    defaultResult(): DocumentSymbolTable;
    visitWorkflowHeader(ctx: XxpWorkflowHeaderContext): DocumentSymbolTable;
    visitWorkflowBody(ctx: XxpWorkflowBodyContext): DocumentSymbolTable;
    visitDataDefinition(ctx: XxpDataDefinitionContext): DocumentSymbolTable;
    visitTaskDefinition(ctx: XxpTaskDefinitionContext): DocumentSymbolTable;
    visitTaskConfiguration(ctx: XxpTaskConfigurationContext): DocumentSymbolTable;
    visitImplementation(ctx: XxpImplementationContext): DocumentSymbolTable;
    visitParamAssignment(ctx: XxpParamAssignmentContext): DocumentSymbolTable;
    visitInputStatement(ctx: XxpInputStatementContext): DocumentSymbolTable;
    visitOutputStatement(ctx: XxpOutputStatementContext): DocumentSymbolTable;
    visitWorkflowNameRead(ctx: XxpWorkflowNameReadContext): DocumentSymbolTable;
    visitDataNameRead(ctx: XxpDataNameReadContext): DocumentSymbolTable;
    visitTaskNameRead(ctx: XxpTaskNameReadContext): DocumentSymbolTable;
    visitFileNameString(ctx: XxpFileNameStringContext): DocumentSymbolTable;
}
//# sourceMappingURL=XxpSymbolTableBuilder.d.ts.map