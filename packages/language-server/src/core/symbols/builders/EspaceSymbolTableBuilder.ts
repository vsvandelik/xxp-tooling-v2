import { AbstractParseTreeVisitor, ParserRuleContext, TerminalNode } from 'antlr4ng';
import { ScopedSymbol, DuplicateSymbolError, BaseSymbol } from 'antlr4-c3';
import { DocumentManager } from '../../managers/DocumentManager.js';
import { Document } from '../../documents/Document.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { ExperimentSymbol } from '../ExperimentSymbol.js';
import { SpaceSymbol } from '../SpaceSymbol.js';
import { DataSymbol } from '../DataSymbol.js';
import { Logger } from '../../../utils/Logger.js';
import { FileUtils } from '../../../utils/FileUtils.js';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { ESPACEVisitor } from '@extremexp/core';
import {
  ProgramContext,
  ExperimentDeclarationContext,
  ExperimentHeaderContext,
  ExperimentBodyContext,
  SpaceDeclarationContext,
  SpaceHeaderContext,
  SpaceBodyContext,
  ControlBlockContext,
  SimpleTransitionContext,
  ConditionalTransitionContext,
  DataDefinitionContext,
  StrategyStatementContext,
  ParamDefinitionContext,
  TaskConfigurationContext,
  ParamAssignmentContext,
  WorkflowNameReadContext,
  SpaceNameReadContext,
  TaskNameReadContext,
  ParamValueContext,
  EnumFunctionContext,
  RangeFunctionContext,
} from '@extremexp/core/src/language/generated/ESPACEParser.js';

interface ControlFlowTransition {
  from: string;
  to: string;
  context: ParserRuleContext;
  isConditional: boolean;
}

export class EspaceSymbolTableBuilder
  extends AbstractParseTreeVisitor<DocumentSymbolTable>
  implements ESPACEVisitor<DocumentSymbolTable>
{
  private readonly logger = Logger.getInstance();
  private currentScope: ScopedSymbol;
  private currentExperiment?: ExperimentSymbol;
  private currentSpace?: SpaceSymbol;
  private controlFlowTransitions: ControlFlowTransition[] = [];
  private definedSpaces = new Set<string>();

  constructor(
    private documentManager: DocumentManager,
    private document: Document,
    private folderSymbolTable: DocumentSymbolTable
  ) {
    super();
    this.currentScope = folderSymbolTable;
  }
  protected override defaultResult(): DocumentSymbolTable {
    return this.folderSymbolTable;
  }
  visitProgram(ctx: ProgramContext): DocumentSymbolTable {
    const result = this.visitChildren(ctx);
    this.validateControlFlow();
    return result ?? this.folderSymbolTable;
  }

  visitExperimentDeclaration(ctx: ExperimentDeclarationContext): DocumentSymbolTable {
    this.visitExperimentHeader(ctx.experimentHeader());
    if (ctx.experimentBody()) {
      this.visitExperimentBody(ctx.experimentBody());
    }
    return this.defaultResult();
  }

  visitExperimentHeader(ctx: ExperimentHeaderContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) {
      this.addDiagnostic(ctx, 'Experiment name is required', DiagnosticSeverity.Error);
      return this.defaultResult();
    }

    const experimentName = identifier.getText();
    this.validateExperimentNameMatchesFileName(identifier, experimentName);

    const experimentSymbol = this.addSymbol(
      ExperimentSymbol,
      experimentName,
      ctx,
      experimentName,
      this.document
    );
    if (!experimentSymbol) return this.defaultResult();

    this.currentExperiment = experimentSymbol;
    this.currentScope = experimentSymbol;
    return this.defaultResult();
  }

  visitExperimentBody(ctx: ExperimentBodyContext): DocumentSymbolTable {
    return this.visitChildren(ctx);
  }

  visitSpaceDeclaration(ctx: SpaceDeclarationContext): DocumentSymbolTable {
    this.visitSpaceHeader(ctx.spaceHeader());
    if (ctx.spaceBody()) {
      this.visitSpaceBody(ctx.spaceBody());
    }
    this.currentSpace = undefined;
    return this.defaultResult();
  }

  visitSpaceHeader(ctx: SpaceHeaderContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    const workflowNameCtx = ctx.workflowNameRead();

    if (!identifier || !workflowNameCtx) {
      this.addDiagnostic(
        ctx,
        'Space name and workflow reference are required',
        DiagnosticSeverity.Error
      );
      return this.defaultResult();
    }

    const spaceName = identifier.getText();
    const workflowName = workflowNameCtx.getText();

    this.validateSpaceName(identifier, spaceName);
    this.validateWorkflowReference(workflowNameCtx, workflowName);

    const spaceSymbol = this.addSymbol(
      SpaceSymbol,
      spaceName,
      ctx,
      spaceName,
      workflowName,
      this.document
    );
    if (!spaceSymbol) return this.defaultResult();

    this.definedSpaces.add(spaceName);
    this.currentSpace = spaceSymbol;
    this.currentScope = spaceSymbol as unknown as ScopedSymbol;
    return this.defaultResult();
  }

  visitSpaceBody(ctx: SpaceBodyContext): DocumentSymbolTable {
    return this.visitChildren(ctx);
  }

  visitControlBlock(ctx: ControlBlockContext): DocumentSymbolTable {
    if (!this.currentExperiment) {
      this.addDiagnostic(
        ctx,
        'Control block must be defined within an experiment',
        DiagnosticSeverity.Error
      );
      return this.visitChildren(ctx);
    }

    // Reset current space when processing control block
    const previousSpace = this.currentSpace;
    this.currentSpace = undefined;
    const result = this.visitChildren(ctx);
    this.currentSpace = previousSpace;
    return result;
  }

  visitSimpleTransition(ctx: SimpleTransitionContext): DocumentSymbolTable {
    const spaceReads = ctx.spaceNameRead();
    if (spaceReads.length < 2) {
      this.addDiagnostic(ctx, 'Transition must have at least two spaces', DiagnosticSeverity.Error);
      return this.visitChildren(ctx);
    }

    for (let i = 0; i < spaceReads.length - 1; i++) {
      const fromSpace = spaceReads[i].getText();
      const toSpace = spaceReads[i + 1].getText();

      this.controlFlowTransitions.push({
        from: fromSpace,
        to: toSpace,
        context: ctx,
        isConditional: false,
      });
    }

    return this.visitChildren(ctx);
  }

  visitConditionalTransition(ctx: ConditionalTransitionContext): DocumentSymbolTable {
    const header = ctx.conditionalTransitionHeader();
    if (!header) return this.visitChildren(ctx);

    const spaceReads = header.spaceNameRead();
    if (spaceReads.length !== 2) {
      this.addDiagnostic(
        header,
        'Conditional transition must have exactly two spaces',
        DiagnosticSeverity.Error
      );
      return this.visitChildren(ctx);
    }

    const fromSpace = spaceReads[0].getText();
    const toSpace = spaceReads[1].getText();

    this.controlFlowTransitions.push({
      from: fromSpace,
      to: toSpace,
      context: ctx,
      isConditional: true,
    });

    const conditions = ctx.conditionalTransitionBody()?.condition();
    if (!conditions || conditions.length === 0) {
      this.addDiagnostic(
        ctx,
        'Conditional transition must have at least one condition',
        DiagnosticSeverity.Warning
      );
    }

    return this.visitChildren(ctx);
  }

  visitDataDefinition(ctx: DataDefinitionContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    const stringValue = ctx.STRING();

    if (!identifier || !stringValue) {
      this.addDiagnostic(ctx, 'Data definition requires name and value', DiagnosticSeverity.Error);
      return this.visitChildren(ctx);
    }

    const dataName = identifier.getText();
    const dataValue = this.cleanString(stringValue.getText());

    const dataSymbol = this.addSymbol(DataSymbol, dataName, ctx, dataName, this.document);
    if (dataSymbol) {
      dataSymbol.value = dataValue;
      this.validateFilePath(stringValue, dataValue);
    }

    return this.visitChildren(ctx);
  }

  visitStrategyStatement(ctx: StrategyStatementContext): DocumentSymbolTable {
    if (!this.currentSpace) {
      this.addDiagnostic(
        ctx,
        'Strategy can only be defined within a space',
        DiagnosticSeverity.Error
      );
      return this.visitChildren(ctx);
    }

    const strategyName = ctx.IDENTIFIER()?.getText();
    if (strategyName) {
      this.validateStrategy(ctx.IDENTIFIER(), strategyName);
      this.currentSpace.strategy = strategyName;
    }

    return this.visitChildren(ctx);
  }

  visitParamDefinition(ctx: ParamDefinitionContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) {
      this.addDiagnostic(ctx, 'Parameter name is required', DiagnosticSeverity.Error);
      return this.visitChildren(ctx);
    }

    const paramName = identifier.getText();
    const paramValue = this.extractParamValue(ctx.paramValue());

    if (this.currentSpace) {
      this.currentSpace.params.set(paramName, paramValue);
    } else if (this.currentExperiment) {
      // Global parameter
      this.addDiagnostic(ctx, 'Global parameters not yet supported', DiagnosticSeverity.Warning);
    }

    return this.visitChildren(ctx);
  }

  visitTaskConfiguration(ctx: TaskConfigurationContext): DocumentSymbolTable {
    if (!this.currentSpace) {
      this.addDiagnostic(
        ctx,
        'Task configuration can only be defined within a space',
        DiagnosticSeverity.Error
      );
      return this.visitChildren(ctx);
    }

    const taskNameCtx = ctx.taskConfigurationHeader()?.taskNameRead();
    if (!taskNameCtx) {
      this.addDiagnostic(ctx, 'Task name is required for configuration', DiagnosticSeverity.Error);
      return this.visitChildren(ctx);
    }

    const taskName = taskNameCtx.getText();
    this.validateTaskInWorkflow(taskNameCtx, taskName);

    return this.visitChildren(ctx);
  }

  visitParamAssignment(ctx: ParamAssignmentContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) {
      this.addDiagnostic(ctx, 'Parameter name is required', DiagnosticSeverity.Error);
      return this.visitChildren(ctx);
    }

    const paramName = identifier.getText();
    const paramValue = this.extractParamValue(ctx.paramValue());

    if (this.currentSpace) {
      this.currentSpace.params.set(paramName, paramValue);
    }

    return this.visitChildren(ctx);
  }

  visitWorkflowNameRead(ctx: WorkflowNameReadContext): DocumentSymbolTable {
    const workflowName = ctx.getText();
    this.addWorkflowReference(ctx, workflowName);
    return this.visitChildren(ctx);
  }

  visitSpaceNameRead(ctx: SpaceNameReadContext): DocumentSymbolTable {
    const spaceName = ctx.getText();
    this.validateSpaceReference(ctx, spaceName);
    return this.visitChildren(ctx);
  }

  visitTaskNameRead(ctx: TaskNameReadContext): DocumentSymbolTable {
    const taskName = ctx.getText();
    // Task validation happens in context of space/workflow
    return this.visitChildren(ctx);
  }

  // Validation methods

  private validateExperimentNameMatchesFileName(
    identifier: TerminalNode,
    experimentName: string
  ): void {
    const expectedFileName = `${experimentName.toLowerCase()}.espace`;
    const actualFileName = FileUtils.getFileName(this.document.uri).toLowerCase();

    if (expectedFileName !== actualFileName) {
      this.addDiagnosticForTerminalNode(
        identifier,
        `Experiment name '${experimentName}' does not match file name. Expected '${expectedFileName}'`,
        DiagnosticSeverity.Error
      );
    }
  }

  private validateSpaceName(identifier: TerminalNode, spaceName: string): void {
    if (spaceName === 'START' || spaceName === 'END') {
      this.addDiagnosticForTerminalNode(
        identifier,
        `Space name '${spaceName}' is reserved`,
        DiagnosticSeverity.Error
      );
    }

    if (this.definedSpaces.has(spaceName)) {
      this.addDiagnosticForTerminalNode(
        identifier,
        `Space '${spaceName}' is already defined`,
        DiagnosticSeverity.Error
      );
    }
  }

  private validateWorkflowReference(ctx: ParserRuleContext, workflowName: string): void {
    const workflowDocument = this.loadWorkflowDocument(workflowName);
    if (!workflowDocument) {
      this.addDiagnostic(ctx, `Workflow '${workflowName}' not found`, DiagnosticSeverity.Error);
      return;
    }

    Document.addDocumentDependency(this.document, workflowDocument);
  }

  private validateTaskInWorkflow(ctx: ParserRuleContext, taskName: string): void {
    if (!this.currentSpace) return;

    const workflowDocument = this.loadWorkflowDocument(this.currentSpace.workflowName);
    if (!workflowDocument) return;

    // Check if task exists in workflow (simplified check)
    // In a full implementation, this would check the workflow's symbol table
    this.addDiagnostic(
      ctx,
      `Task validation for '${taskName}' in workflow '${this.currentSpace.workflowName}' not fully implemented`,
      DiagnosticSeverity.Information
    );
  }

  private validateSpaceReference(ctx: ParserRuleContext, spaceName: string): void {
    if (spaceName === 'START' || spaceName === 'END') {
      return; // Reserved names are valid
    }

    if (!this.definedSpaces.has(spaceName)) {
      this.addDiagnostic(ctx, `Space '${spaceName}' is not defined`, DiagnosticSeverity.Error);
    }
  }

  private validateStrategy(identifier: TerminalNode, strategy: string): void {
    const validStrategies = ['gridsearch', 'randomsearch', 'random'];
    if (!validStrategies.includes(strategy.toLowerCase())) {
      this.addDiagnosticForTerminalNode(
        identifier,
        `Invalid strategy '${strategy}'. Valid strategies: ${validStrategies.join(', ')}`,
        DiagnosticSeverity.Error
      );
    }
  }

  private validateControlFlow(): void {
    if (this.controlFlowTransitions.length === 0) {
      if (this.definedSpaces.size > 0) {
        this.addDiagnostic(
          this.currentExperiment?.context as ParserRuleContext,
          'Control flow must be defined when spaces are present',
          DiagnosticSeverity.Error
        );
      }
      return;
    }

    this.validateControlFlowStructure();
    this.validateReachability();
  }

  private validateControlFlowStructure(): void {
    const startTransitions = this.controlFlowTransitions.filter(t => t.from === 'START');
    const endTransitions = this.controlFlowTransitions.filter(t => t.to === 'END');
    const fromEndTransitions = this.controlFlowTransitions.filter(t => t.from === 'END');

    if (startTransitions.length === 0) {
      this.addDiagnostic(
        this.currentExperiment?.context as ParserRuleContext,
        'Control flow must start from START',
        DiagnosticSeverity.Error
      );
    }

    if (startTransitions.length > 1) {
      this.addDiagnostic(
        startTransitions[1].context,
        'Only one transition from START is allowed',
        DiagnosticSeverity.Error
      );
    }

    if (endTransitions.length === 0) {
      this.addDiagnostic(
        this.currentExperiment?.context as ParserRuleContext,
        'Control flow must reach END',
        DiagnosticSeverity.Error
      );
    }

    if (fromEndTransitions.length > 0) {
      this.addDiagnostic(
        fromEndTransitions[0].context,
        'No transitions allowed from END',
        DiagnosticSeverity.Error
      );
    }
  }

  private validateReachability(): void {
    const reachableSpaces = new Set<string>();
    const visited = new Set<string>();

    const traverse = (spaceName: string) => {
      if (visited.has(spaceName)) return;
      visited.add(spaceName);
      reachableSpaces.add(spaceName);

      const outgoingTransitions = this.controlFlowTransitions.filter(t => t.from === spaceName);
      for (const transition of outgoingTransitions) {
        traverse(transition.to);
      }
    };

    traverse('START');

    for (const spaceName of this.definedSpaces) {
      if (!reachableSpaces.has(spaceName)) {
        this.addDiagnostic(
          this.currentExperiment?.context as ParserRuleContext,
          `Space '${spaceName}' is not reachable from START`,
          DiagnosticSeverity.Warning
        );
      }
    }
  }

  private validateFilePath(node: TerminalNode, filePath: string): void {
    try {
      FileUtils.validateFilePath(filePath);
    } catch (error) {
      this.addDiagnosticForTerminalNode(
        node,
        `File path error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        DiagnosticSeverity.Warning
      );
    }
  }

  // Helper methods

  private loadWorkflowDocument(workflowName: string): Document | undefined {
    const workflowFileName = `${workflowName.toLowerCase()}.xxp`;
    const workflowUri = this.document.uri.replace(/[^/\\]+$/, workflowFileName);
    return this.documentManager.loadDocumentFromFileSystem(workflowUri);
  }

  private extractParamValue(paramValueCtx: ParamValueContext): any {
    if (paramValueCtx.enumFunction()) {
      return this.extractEnumValue(paramValueCtx.enumFunction());
    } else if (paramValueCtx.rangeFunction()) {
      return this.extractRangeValue(paramValueCtx.rangeFunction());
    } else if (paramValueCtx.expression()) {
      return paramValueCtx.expression().getText();
    }
    return null;
  }

  private extractEnumValue(enumCtx: EnumFunctionContext): string[] {
    return enumCtx.expression().map(expr => this.cleanString(expr.getText()));
  }

  private extractRangeValue(rangeCtx: RangeFunctionContext): number[] {
    const numbers = rangeCtx.NUMBER();
    if (numbers.length !== 3) {
      this.addDiagnostic(
        rangeCtx,
        'Range function must have exactly 3 numbers: min, max, step',
        DiagnosticSeverity.Error
      );
      return [];
    }
    return numbers.map(num => parseFloat(num.getText()));
  }

  private addWorkflowReference(ctx: ParserRuleContext, workflowName: string): void {
    // Add reference tracking for workflow names
    // This could be used for go-to-definition and find references
  } // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private addSymbol<T extends BaseSymbol>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: new (...args: any[]) => T,
    name: string,
    ctx: ParserRuleContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ): T | undefined {
    try {
      const symbol = this.folderSymbolTable.addNewSymbolOfType(
        type,
        this.currentScope,
        name,
        ...args
      ) as T;
      symbol.context = ctx;
      return symbol;
    } catch (error) {
      if (error instanceof DuplicateSymbolError) {
        this.addDiagnostic(ctx, `Duplicate symbol '${name}'`, DiagnosticSeverity.Error);
      }
      return undefined;
    }
  }

  private addDiagnostic(
    ctx: ParserRuleContext,
    message: string,
    severity: DiagnosticSeverity
  ): void {
    if (!ctx.start || !ctx.stop) return;

    this.document.diagnostics.push({
      severity,
      range: {
        start: { line: ctx.start.line - 1, character: ctx.start.column },
        end: { line: ctx.stop.line - 1, character: ctx.stop.column + ctx.getText().length },
      },
      message,
      source: 'ESPACE',
    });
  }

  private addDiagnosticForTerminalNode(
    node: TerminalNode,
    message: string,
    severity: DiagnosticSeverity
  ): void {
    this.document.diagnostics.push({
      severity,
      range: {
        start: { line: node.symbol.line - 1, character: node.symbol.column },
        end: { line: node.symbol.line - 1, character: node.symbol.column + node.getText().length },
      },
      message,
      source: 'ESPACE',
    });
  }

  private cleanString(str: string): string {
    return str.startsWith('"') && str.endsWith('"') ? str.slice(1, -1) : str;
  }
}
