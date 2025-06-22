import { AbstractParseTreeVisitor } from 'antlr4ng';
import { DocumentManager } from '../../../core/managers/DocumentsManager';
import { Logger } from '../../../utils/Logger';
import { DocumentSymbolTable } from '../DocumentSymbolTable';
import { WorkflowVisitor } from '../visitors/WorkflowVisitor';
import { DataVisitor } from '../visitors/DataVisitor';
import { VariableReadVisitor } from '../visitors/VariableReadVisitor';
import { TaskVisitor } from '../visitors/TaskVisitor';
import { ScopedSymbol } from 'antlr4-c3';
import { FileVisitor } from '../visitors/FileVisitor';
import { Document } from '../../../core/documents/Document';
import { XXPVisitor } from '@extremexp/core';
import { DataDefinitionContext, TaskConfigurationContext, ParamAssignmentContext, WorkflowNameReadContext, TaskNameReadContext } from '@extremexp/core/src/language/generated/ESPACEParser';
import { WorkflowHeaderContext, WorkflowBodyContext, TaskDefinitionContext, ImplementationContext, DataNameReadContext } from '@extremexp/core/src/language/generated/XXPParser';

export class XxpSymbolTableBuilder extends AbstractParseTreeVisitor<DocumentSymbolTable> implements XXPVisitor<DocumentSymbolTable> {
	public readonly logger = Logger.getLogger();
	public currentScope: ScopedSymbol;

	private readonly workflowVisitor: WorkflowVisitor;
	private readonly dataVisitor: DataVisitor;
	private readonly taskVisitor: TaskVisitor;
	private readonly variableReadVisitor: VariableReadVisitor;
	//private readonly dataChainVisitor: DataChainVisitor;
	private readonly fileVisitor: FileVisitor;

	constructor(
		public readonly documentsManager: DocumentManager,
		public readonly document: Document,
		public readonly symbolTable: DocumentSymbolTable,
	) {
		super();
		this.currentScope = this.symbolTable;
		this.workflowVisitor = new WorkflowVisitor(this);
		this.dataVisitor = new DataVisitor(this);
		this.taskVisitor = new TaskVisitor(this);
		this.variableReadVisitor = new VariableReadVisitor(this);
		//this.dataChainVisitor = new DataChainVisitor(this);
		this.fileVisitor = new FileVisitor(this);
	}

	public override defaultResult(): DocumentSymbolTable {
		return this.symbolTable;
	}
/*
	visitWorkflowHeader(ctx: WorkflowHeaderContext): DocumentSymbolTable { return this.workflowVisitor.visitHeader(ctx); }
	visitWorkflowBody(ctx: WorkflowBodyContext): DocumentSymbolTable { return this.workflowVisitor.visitBody(ctx); }
	visitDataDefinition(ctx: DataDefinitionContext): DocumentSymbolTable { return this.dataVisitor.visitDefinition(ctx); }
	visitSchemaDefinition(ctx: SchemaDefinitionContext): DocumentSymbolTable { return this.dataVisitor.visitSchema(ctx); }
	visitTaskDefinition(ctx: TaskDefinitionContext): DocumentSymbolTable { return this.taskVisitor.visitDefinition(ctx); }
	visitTaskConfiguration(ctx: TaskConfigurationContext): DocumentSymbolTable { return this.taskVisitor.visitConfiguration(ctx); }
	visitParamAssignment(ctx: ParamAssignmentContext): DocumentSymbolTable { return this.taskVisitor.visitParam(ctx); }
	visitImplementation(ctx: ImplementationContext): DocumentSymbolTable { return this.taskVisitor.visitImplementation(ctx); }
	visitWorkflowNameRead(ctx: WorkflowNameReadContext): DocumentSymbolTable { return this.variableReadVisitor.visitWorkflow(ctx); }
	visitDataNameRead(ctx: DataNameReadContext): DocumentSymbolTable { return this.variableReadVisitor.visitData(ctx); }
	visitTaskNameRead(ctx: TaskNameReadContext): DocumentSymbolTable { return this.variableReadVisitor.visitTask(ctx); }
	visitDataChain(ctx: DataChainContext): DocumentSymbolTable { return this.dataChainVisitor.visitChain(ctx); }
	visitFileNameString(ctx: FileNameStringContext): DocumentSymbolTable { return this.fileVisitor.visitFileName(ctx); }*/
}