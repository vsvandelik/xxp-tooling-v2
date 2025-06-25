import { AbstractParseTreeVisitor } from 'antlr4ng';
import { DocumentManager } from '../../../core/managers/DocumentsManager.js';
import { Logger } from '../../../utils/Logger.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { WorkflowVisitor } from '../visitors/WorkflowVisitor.js';
import { DataVisitor } from '../visitors/DataVisitor.js';
import { VariableReadVisitor } from '../visitors/VariableReadVisitor.js';
import { TaskVisitor } from '../visitors/TaskVisitor.js';
import { ScopedSymbol } from 'antlr4-c3';
import { FileVisitor } from '../visitors/FileVisitor.js';
import { Document } from '../../../core/documents/Document.js';
import { XXPVisitor } from '@extremexp/core';
import {
  XxpDataDefinitionContext,
  XxpTaskConfigurationContext,
  XxpParamAssignmentContext,
  XxpWorkflowNameReadContext,
  XxpTaskNameReadContext,
  XxpWorkflowHeaderContext,
  XxpWorkflowBodyContext,
  XxpTaskDefinitionContext,
  XxpImplementationContext,
  XxpInputStatementContext,
  XxpOutputStatementContext,
  XxpDataNameReadContext,
  XxpFileNameStringContext,
} from '@extremexp/core';

export class XxpSymbolTableBuilder
  extends AbstractParseTreeVisitor<DocumentSymbolTable>
  implements XXPVisitor<DocumentSymbolTable>
{
  public readonly logger = Logger.getLogger();
  public currentScope: ScopedSymbol;

  private readonly workflowVisitor: WorkflowVisitor;
  private readonly dataVisitor: DataVisitor;
  private readonly taskVisitor: TaskVisitor;
  private readonly variableReadVisitor: VariableReadVisitor;
  private readonly fileVisitor: FileVisitor;

  constructor(
    public readonly documentsManager: DocumentManager,
    public readonly document: Document,
    public readonly symbolTable: DocumentSymbolTable
  ) {
    super();
    this.currentScope = this.symbolTable;
    this.workflowVisitor = new WorkflowVisitor(this);
    this.dataVisitor = new DataVisitor(this);
    this.taskVisitor = new TaskVisitor(this);
    this.variableReadVisitor = new VariableReadVisitor(this);
    this.fileVisitor = new FileVisitor(this);
  }

  public override defaultResult(): DocumentSymbolTable {
    return this.symbolTable;
  }

  visitWorkflowHeader(ctx: XxpWorkflowHeaderContext): DocumentSymbolTable {
    console.error(`[BUILDER] XxpSymbolTableBuilder.visitWorkflowHeader: ${ctx.getText()}`);
    return this.workflowVisitor.visitHeader(ctx);
  }
  visitWorkflowBody(ctx: XxpWorkflowBodyContext): DocumentSymbolTable {
    console.error(`[BUILDER] XxpSymbolTableBuilder.visitWorkflowBody`);
    return this.workflowVisitor.visitBody(ctx);
  }
  visitDataDefinition(ctx: XxpDataDefinitionContext): DocumentSymbolTable {
    console.error(`[BUILDER] XxpSymbolTableBuilder.visitDataDefinition: ${ctx.getText()}`);
    return this.dataVisitor.visitDefinition(ctx);
  }
  visitTaskDefinition(ctx: XxpTaskDefinitionContext): DocumentSymbolTable {
    console.error(`[BUILDER] XxpSymbolTableBuilder.visitTaskDefinition: ${ctx.getText()}`);
    return this.taskVisitor.visitDefinition(ctx);
  }
  visitTaskConfiguration(ctx: XxpTaskConfigurationContext): DocumentSymbolTable {
    console.error(`[BUILDER] XxpSymbolTableBuilder.visitTaskConfiguration: ${ctx.getText()}`);
    return this.taskVisitor.visitConfiguration(ctx);
  }
  visitImplementation(ctx: XxpImplementationContext): DocumentSymbolTable {
    console.error(`[BUILDER] XxpSymbolTableBuilder.visitImplementation: ${ctx.getText()}`);
    return this.taskVisitor.visitImplementation(ctx);
  }
  visitParamAssignment(ctx: XxpParamAssignmentContext): DocumentSymbolTable {
    console.error(`[BUILDER] XxpSymbolTableBuilder.visitParamAssignment: ${ctx.getText()}`);
    return this.taskVisitor.visitParam(ctx);
  }
  visitInputStatement(ctx: XxpInputStatementContext): DocumentSymbolTable {
    console.error(`[BUILDER] XxpSymbolTableBuilder.visitInputStatement: ${ctx.getText()}`);
    return this.taskVisitor.visitInput(ctx);
  }
  visitOutputStatement(ctx: XxpOutputStatementContext): DocumentSymbolTable {
    console.error(`[BUILDER] XxpSymbolTableBuilder.visitOutputStatement: ${ctx.getText()}`);
    return this.taskVisitor.visitOutput(ctx);
  }

  visitWorkflowNameRead(ctx: XxpWorkflowNameReadContext): DocumentSymbolTable {
    console.error(`[BUILDER] XxpSymbolTableBuilder.visitWorkflowNameRead: ${ctx.getText()}`);
    return this.variableReadVisitor.visitWorkflow(ctx);
  }
  visitDataNameRead(ctx: XxpDataNameReadContext): DocumentSymbolTable {
    console.error(`[BUILDER] XxpSymbolTableBuilder.visitDataNameRead: ${ctx.getText()}`);
    return this.variableReadVisitor.visitData(ctx);
  }
  visitTaskNameRead(ctx: XxpTaskNameReadContext): DocumentSymbolTable {
    console.error(`[BUILDER] XxpSymbolTableBuilder.visitTaskNameRead: ${ctx.getText()}`);
    return this.variableReadVisitor.visitTask(ctx);
  }
  visitFileNameString(ctx: XxpFileNameStringContext): DocumentSymbolTable {
    console.error(`[BUILDER] XxpSymbolTableBuilder.visitFileNameString: ${ctx.getText()}`);
    return this.fileVisitor.visitFileName(ctx);
  }
}
