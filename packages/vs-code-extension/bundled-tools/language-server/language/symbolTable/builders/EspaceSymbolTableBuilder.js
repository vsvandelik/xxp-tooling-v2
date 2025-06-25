import { AbstractParseTreeVisitor } from 'antlr4ng';
import { Logger } from '../../../utils/Logger.js';
import { EspaceExperimentVisitor } from '../visitors/EspaceExperimentVisitor.js';
import { EspaceSpaceVisitor } from '../visitors/EspaceSpaceVisitor.js';
import { EspaceParamVisitor } from '../visitors/EspaceParamVisitor.js';
import { EspaceControlVisitor } from '../visitors/EspaceControlVisitor.js';
import { EspaceDataVisitor } from '../visitors/EspaceDataVisitor.js';
import { EspaceTaskConfigurationVisitor } from '../visitors/EspaceTaskConfigurationVisitor.js';
import { EspaceVariableReadVisitor } from '../visitors/EspaceVariableReadVisitor.js';
export class EspaceSymbolTableBuilder extends AbstractParseTreeVisitor {
    documentsManager;
    document;
    symbolTable;
    logger = Logger.getLogger();
    currentScope;
    experimentVisitor;
    spaceVisitor;
    paramVisitor;
    controlVisitor;
    dataVisitor;
    taskConfigurationVisitor;
    variableReadVisitor;
    constructor(documentsManager, document, symbolTable) {
        super();
        this.documentsManager = documentsManager;
        this.document = document;
        this.symbolTable = symbolTable;
        this.currentScope = this.symbolTable;
        this.experimentVisitor = new EspaceExperimentVisitor(this);
        this.spaceVisitor = new EspaceSpaceVisitor(this);
        this.paramVisitor = new EspaceParamVisitor(this);
        this.controlVisitor = new EspaceControlVisitor(this);
        this.dataVisitor = new EspaceDataVisitor(this);
        this.taskConfigurationVisitor = new EspaceTaskConfigurationVisitor(this);
        this.variableReadVisitor = new EspaceVariableReadVisitor(this);
    }
    defaultResult() {
        return this.symbolTable;
    }
    visitExperimentHeader(ctx) {
        return this.experimentVisitor.visitHeader(ctx);
    }
    visitExperimentBody(ctx) {
        return this.experimentVisitor.visitBody(ctx);
    }
    visitSpaceDeclaration(ctx) {
        return this.spaceVisitor.visitDeclaration(ctx);
    }
    visitSpaceHeader(ctx) {
        return this.spaceVisitor.visitHeader(ctx);
    }
    visitSpaceBody(ctx) {
        return this.spaceVisitor.visitBody(ctx);
    }
    visitStrategyStatement(ctx) {
        return this.spaceVisitor.visitStrategy(ctx);
    }
    visitParamDefinition(ctx) {
        return this.paramVisitor.visitDefinition(ctx);
    }
    visitParamAssignment(ctx) {
        return this.taskConfigurationVisitor.visitParamAssignment(ctx);
    }
    visitControlBlock(ctx) {
        return this.controlVisitor.visitBlock(ctx);
    }
    visitControlBody(ctx) {
        return this.controlVisitor.visitBody(ctx);
    }
    visitSimpleTransition(ctx) {
        return this.controlVisitor.visitSimpleTransition(ctx);
    }
    visitConditionalTransition(ctx) {
        return this.controlVisitor.visitConditionalTransition(ctx);
    }
    visitDataDefinition(ctx) {
        return this.dataVisitor.visitDefinition(ctx);
    }
    visitTaskConfiguration(ctx) {
        return this.taskConfigurationVisitor.visitConfiguration(ctx);
    }
    visitWorkflowNameRead(ctx) {
        return this.variableReadVisitor.visitWorkflow(ctx);
    }
    visitTaskNameRead(ctx) {
        return this.variableReadVisitor.visitTask(ctx);
    }
    visitSpaceNameRead(ctx) {
        return this.variableReadVisitor.visitSpace(ctx);
    }
}
//# sourceMappingURL=EspaceSymbolTableBuilder.js.map