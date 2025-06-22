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
  DataDefinitionContext,
  TaskConfigurationContext,
  ParamAssignmentContext,
  WorkflowNameReadContext,
  TaskNameReadContext,
  WorkflowHeaderContext,
  WorkflowBodyContext,
  TaskDefinitionContext,
  ImplementationContext,
  InputStatementContext,
  OutputStatementContext,
  DataNameReadContext,
  FileNameStringContext,
} from '@extremexp/core/src/language/generated/XXPParser.js';

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

  visitWorkflowHeader(ctx: WorkflowHeaderContext): DocumentSymbolTable {
    return this.workflowVisitor.visitHeader(ctx);
  }
  visitWorkflowBody(ctx: WorkflowBodyContext): DocumentSymbolTable {
    return this.workflowVisitor.visitBody(ctx);
  }
  visitDataDefinition(ctx: DataDefinitionContext): DocumentSymbolTable {
    return this.dataVisitor.visitDefinition(ctx);
  }
  visitTaskDefinition(ctx: TaskDefinitionContext): DocumentSymbolTable {
    return this.taskVisitor.visitDefinition(ctx);
  }
  visitTaskConfiguration(ctx: TaskConfigurationContext): DocumentSymbolTable {
    return this.taskVisitor.visitConfiguration(ctx);
  }
  visitImplementation(ctx: ImplementationContext): DocumentSymbolTable {
    return this.taskVisitor.visitImplementation(ctx);
  }
  visitParamAssignment(ctx: ParamAssignmentContext): DocumentSymbolTable {
    return this.taskVisitor.visitParam(ctx);
  }
  visitInputStatement(ctx: InputStatementContext): DocumentSymbolTable {
    return this.taskVisitor.visitInput(ctx);
  }
  visitOutputStatement(ctx: OutputStatementContext): DocumentSymbolTable {
    return this.taskVisitor.visitOutput(ctx);
  }

  visitWorkflowNameRead(ctx: WorkflowNameReadContext): DocumentSymbolTable {
    return this.variableReadVisitor.visitWorkflow(ctx);
  }
  visitDataNameRead(ctx: DataNameReadContext): DocumentSymbolTable {
    return this.variableReadVisitor.visitData(ctx);
  }
  visitTaskNameRead(ctx: TaskNameReadContext): DocumentSymbolTable {
    return this.variableReadVisitor.visitTask(ctx);
  }
  visitFileNameString(ctx: FileNameStringContext): DocumentSymbolTable {
    return this.fileVisitor.visitFileName(ctx);
  }
}
