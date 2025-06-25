import { AbstractParseTreeVisitor } from 'antlr4ng';
import { Logger } from '../../../utils/Logger.js';
import { WorkflowVisitor } from '../visitors/WorkflowVisitor.js';
import { DataVisitor } from '../visitors/DataVisitor.js';
import { VariableReadVisitor } from '../visitors/VariableReadVisitor.js';
import { TaskVisitor } from '../visitors/TaskVisitor.js';
import { FileVisitor } from '../visitors/FileVisitor.js';
export class XxpSymbolTableBuilder extends AbstractParseTreeVisitor {
    documentsManager;
    document;
    symbolTable;
    logger = Logger.getLogger();
    currentScope;
    workflowVisitor;
    dataVisitor;
    taskVisitor;
    variableReadVisitor;
    fileVisitor;
    constructor(documentsManager, document, symbolTable) {
        super();
        this.documentsManager = documentsManager;
        this.document = document;
        this.symbolTable = symbolTable;
        this.currentScope = this.symbolTable;
        this.workflowVisitor = new WorkflowVisitor(this);
        this.dataVisitor = new DataVisitor(this);
        this.taskVisitor = new TaskVisitor(this);
        this.variableReadVisitor = new VariableReadVisitor(this);
        this.fileVisitor = new FileVisitor(this);
    }
    defaultResult() {
        return this.symbolTable;
    }
    visitWorkflowHeader(ctx) {
        return this.workflowVisitor.visitHeader(ctx);
    }
    visitWorkflowBody(ctx) {
        return this.workflowVisitor.visitBody(ctx);
    }
    visitDataDefinition(ctx) {
        return this.dataVisitor.visitDefinition(ctx);
    }
    visitTaskDefinition(ctx) {
        return this.taskVisitor.visitDefinition(ctx);
    }
    visitTaskConfiguration(ctx) {
        return this.taskVisitor.visitConfiguration(ctx);
    }
    visitImplementation(ctx) {
        return this.taskVisitor.visitImplementation(ctx);
    }
    visitParamAssignment(ctx) {
        return this.taskVisitor.visitParam(ctx);
    }
    visitInputStatement(ctx) {
        return this.taskVisitor.visitInput(ctx);
    }
    visitOutputStatement(ctx) {
        return this.taskVisitor.visitOutput(ctx);
    }
    visitWorkflowNameRead(ctx) {
        return this.variableReadVisitor.visitWorkflow(ctx);
    }
    visitDataNameRead(ctx) {
        return this.variableReadVisitor.visitData(ctx);
    }
    visitTaskNameRead(ctx) {
        return this.variableReadVisitor.visitTask(ctx);
    }
    visitFileNameString(ctx) {
        return this.fileVisitor.visitFileName(ctx);
    }
}
//# sourceMappingURL=XxpSymbolTableBuilder.js.map