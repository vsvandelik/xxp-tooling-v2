import { AbstractParseTreeVisitor } from 'antlr4ng';
import { ScopedSymbol } from 'antlr4-c3';
import { DocumentManager } from '../../../core/managers/DocumentsManager.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { Document } from '../../../core/documents/Document.js';
import { Logger } from '../../../utils/Logger.js';
import { EspaceExperimentVisitor } from '../visitors/EspaceExperimentVisitor.js';
import { EspaceSpaceVisitor } from '../visitors/EspaceSpaceVisitor.js';
import { EspaceParamVisitor } from '../visitors/EspaceParamVisitor.js';
import { EspaceControlVisitor } from '../visitors/EspaceControlVisitor.js';
import { EspaceDataVisitor } from '../visitors/EspaceDataVisitor.js';
import { EspaceTaskConfigurationVisitor } from '../visitors/EspaceTaskConfigurationVisitor.js';
import { EspaceVariableReadVisitor } from '../visitors/EspaceVariableReadVisitor.js';
import {
  ESPACEVisitor,
  EspaceExperimentHeaderContext,
  EspaceExperimentBodyContext,
  EspaceSpaceDeclarationContext,
  EspaceSpaceHeaderContext,
  EspaceSpaceBodyContext,
  EspaceStrategyStatementContext,
  EspaceParamDefinitionContext,
  EspaceControlBlockContext,
  EspaceControlBodyContext,
  EspaceSimpleTransitionContext,
  EspaceConditionalTransitionContext,
  EspaceDataDefinitionContext,
  EspaceTaskConfigurationContext,
  EspaceParamAssignmentContext,
  EspaceWorkflowNameReadContext,
  EspaceTaskNameReadContext,
  EspaceSpaceNameReadContext,
} from '@extremexp/core';

export class EspaceSymbolTableBuilder
  extends AbstractParseTreeVisitor<DocumentSymbolTable>
  implements ESPACEVisitor<DocumentSymbolTable>
{
  public readonly logger = Logger.getLogger();
  public currentScope: ScopedSymbol;

  private readonly experimentVisitor: EspaceExperimentVisitor;
  private readonly spaceVisitor: EspaceSpaceVisitor;
  private readonly paramVisitor: EspaceParamVisitor;
  private readonly controlVisitor: EspaceControlVisitor;
  private readonly dataVisitor: EspaceDataVisitor;
  private readonly taskConfigurationVisitor: EspaceTaskConfigurationVisitor;
  private readonly variableReadVisitor: EspaceVariableReadVisitor;

  constructor(
    public readonly documentsManager: DocumentManager,
    public readonly document: Document,
    public readonly symbolTable: DocumentSymbolTable
  ) {
    super();
    this.currentScope = this.symbolTable;
    this.experimentVisitor = new EspaceExperimentVisitor(this);
    this.spaceVisitor = new EspaceSpaceVisitor(this);
    this.paramVisitor = new EspaceParamVisitor(this);
    this.controlVisitor = new EspaceControlVisitor(this);
    this.dataVisitor = new EspaceDataVisitor(this);
    this.taskConfigurationVisitor = new EspaceTaskConfigurationVisitor(this);
    this.variableReadVisitor = new EspaceVariableReadVisitor(this);
  }

  public override defaultResult(): DocumentSymbolTable {
    return this.symbolTable;
  }

  // Experiment methods
  visitExperimentHeader(ctx: EspaceExperimentHeaderContext): DocumentSymbolTable {
    return this.experimentVisitor.visitHeader(ctx);
  }

  visitExperimentBody(ctx: EspaceExperimentBodyContext): DocumentSymbolTable {
    return this.experimentVisitor.visitBody(ctx);
  }

  // Space methods
  visitSpaceDeclaration(ctx: EspaceSpaceDeclarationContext): DocumentSymbolTable {
    return this.spaceVisitor.visitDeclaration(ctx);
  }

  visitSpaceHeader(ctx: EspaceSpaceHeaderContext): DocumentSymbolTable {
    return this.spaceVisitor.visitHeader(ctx);
  }

  visitSpaceBody(ctx: EspaceSpaceBodyContext): DocumentSymbolTable {
    return this.spaceVisitor.visitBody(ctx);
  }

  visitStrategyStatement(ctx: EspaceStrategyStatementContext): DocumentSymbolTable {
    return this.spaceVisitor.visitStrategy(ctx);
  }

  // Parameter methods
  visitParamDefinition(ctx: EspaceParamDefinitionContext): DocumentSymbolTable {
    return this.paramVisitor.visitDefinition(ctx);
  }

  visitParamAssignment(ctx: EspaceParamAssignmentContext): DocumentSymbolTable {
    return this.taskConfigurationVisitor.visitParamAssignment(ctx);
  }

  // Control block methods
  visitControlBlock(ctx: EspaceControlBlockContext): DocumentSymbolTable {
    return this.controlVisitor.visitBlock(ctx);
  }

  visitControlBody(ctx: EspaceControlBodyContext): DocumentSymbolTable {
    return this.controlVisitor.visitBody(ctx);
  }

  visitSimpleTransition(ctx: EspaceSimpleTransitionContext): DocumentSymbolTable {
    return this.controlVisitor.visitSimpleTransition(ctx);
  }

  visitConditionalTransition(ctx: EspaceConditionalTransitionContext): DocumentSymbolTable {
    return this.controlVisitor.visitConditionalTransition(ctx);
  }

  // Data methods
  visitDataDefinition(ctx: EspaceDataDefinitionContext): DocumentSymbolTable {
    return this.dataVisitor.visitDefinition(ctx);
  }

  // Task configuration methods
  visitTaskConfiguration(ctx: EspaceTaskConfigurationContext): DocumentSymbolTable {
    return this.taskConfigurationVisitor.visitConfiguration(ctx);
  }

  // Variable read methods
  visitWorkflowNameRead(ctx: EspaceWorkflowNameReadContext): DocumentSymbolTable {
    return this.variableReadVisitor.visitWorkflow(ctx);
  }

  visitTaskNameRead(ctx: EspaceTaskNameReadContext): DocumentSymbolTable {
    return this.variableReadVisitor.visitTask(ctx);
  }

  visitSpaceNameRead(ctx: EspaceSpaceNameReadContext): DocumentSymbolTable {
    return this.variableReadVisitor.visitSpace(ctx);
  }
}
