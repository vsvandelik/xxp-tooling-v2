import { AbstractParseTreeVisitor, ParserRuleContext, TerminalNode } from 'antlr4ng';
import { ScopedSymbol, DuplicateSymbolError, BaseSymbol } from 'antlr4-c3';
import { DocumentManager } from '../../managers/DocumentManager.js';
import { Document } from '../../documents/Document.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { WorkflowSymbol } from '../WorkflowSymbol.js';
import { DataSymbol } from '../DataSymbol.js';
import { TaskSymbol } from '../TaskSymbol.js';
import { Logger } from '../../../utils/Logger.js';
import { FileUtils } from '../../../utils/FileUtils.js';
import { DiagnosticSeverity } from 'vscode-languageserver';
import {
  ChainElementContext,
  DataDefinitionContext,
  DataNameReadContext,
  ImplementationContext,
  InputStatementContext,
  OutputStatementContext,
  ParamAssignmentContext,
  ProgramContext,
  TaskChainContext,
  TaskConfigurationContext,
  TaskDefinitionContext,
  TaskNameReadContext,
  WorkflowBodyContext,
  WorkflowDeclarationContext,
  WorkflowHeaderContext,
  WorkflowNameReadContext,
} from '@extremexp/core/src/language/generated/XXPParser.js';
import { XXPVisitor } from '@extremexp/core';

export class XxpSymbolTableBuilder
  extends AbstractParseTreeVisitor<DocumentSymbolTable>
  implements XXPVisitor<DocumentSymbolTable>
{
  private readonly logger = Logger.getInstance();
  private currentScope: ScopedSymbol;

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
    return this.visitChildren(ctx) as DocumentSymbolTable;
  }

  visitWorkflowDeclaration(ctx: WorkflowDeclarationContext): DocumentSymbolTable {
    this.visitWorkflowHeader(ctx.workflowHeader());
    if (ctx.workflowBody()) {
      this.visitWorkflowBody(ctx.workflowBody());
    }
    return this.defaultResult();
  }

  visitWorkflowHeader(ctx: WorkflowHeaderContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) {
      this.addDiagnostic(ctx, 'Workflow name is required', DiagnosticSeverity.Error);
      return this.defaultResult();
    }

    const workflowName = identifier.getText();
    this.validateWorkflowNameMatchesFileName(identifier, workflowName);

    const existingWorkflow = this.getExistingWorkflowSymbol(workflowName);
    let workflowSymbol: WorkflowSymbol;

    if (existingWorkflow && existingWorkflow.document.uri === this.document.uri) {
      existingWorkflow.clear();
      workflowSymbol = existingWorkflow;
    } else {
      const newWorkflowSymbol = this.addSymbol(
        WorkflowSymbol,
        workflowName,
        ctx,
        workflowName,
        this.document
      );
      if (!newWorkflowSymbol) return this.defaultResult();
      workflowSymbol = newWorkflowSymbol;
    }

    // Handle parent workflow if specified
    const workflowNameRead = ctx.workflowNameRead();
    if (workflowNameRead) {
      this.handleParentWorkflow(workflowNameRead, workflowSymbol);
    }

    this.currentScope = workflowSymbol;
    return this.defaultResult();
  }

  visitWorkflowBody(ctx: WorkflowBodyContext): DocumentSymbolTable {
    // Add default START and END tasks if no parent workflow
    if (this.currentScope instanceof WorkflowSymbol && !this.currentScope.parentWorkflow) {
      this.addSymbol(TaskSymbol, 'START', ctx, 'START', this.document);
      this.addSymbol(TaskSymbol, 'END', ctx, 'END', this.document);
    }

    return this.visitChildren(ctx) as DocumentSymbolTable;
  }

  visitDataDefinition(ctx: DataDefinitionContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) {
      this.addDiagnostic(ctx, 'Data name is required', DiagnosticSeverity.Error);
      return this.visitChildren(ctx) as DocumentSymbolTable;
    }

    const dataName = identifier.getText();
    const dataSymbol = this.addSymbol(DataSymbol, dataName, ctx, dataName, this.document);

    const stringNode = ctx.STRING();
    if (dataSymbol && stringNode) {
      dataSymbol.value = this.cleanString(stringNode.getText());
      this.validateFilePath(stringNode, dataSymbol.value);
    }

    return this.visitChildren(ctx) as DocumentSymbolTable;
  }

  visitTaskDefinition(ctx: TaskDefinitionContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) {
      this.addDiagnostic(ctx, 'Task name is required', DiagnosticSeverity.Error);
      return this.visitChildren(ctx) as DocumentSymbolTable;
    }

    const taskName = identifier.getText();
    this.validateTaskName(identifier, taskName);
    this.addSymbol(TaskSymbol, taskName, ctx, taskName, this.document);

    return this.visitChildren(ctx) as DocumentSymbolTable;
  }

  visitTaskChain(ctx: TaskChainContext): DocumentSymbolTable {
    const elements = ctx.chainElement();
    if (elements.length < 2) {
      this.addDiagnostic(
        ctx,
        'Task chain must have at least two elements',
        DiagnosticSeverity.Error
      );
      return this.visitChildren(ctx) as DocumentSymbolTable;
    }

    // Validate chain elements
    for (const element of elements) {
      this.validateChainElement(element);
    }

    // Validate control flow rules
    this.validateControlFlowRules(elements);

    return this.visitChildren(ctx) as DocumentSymbolTable;
  }

  visitTaskConfiguration(ctx: TaskConfigurationContext): DocumentSymbolTable {
    const taskNameContext = ctx.taskConfigurationHeader()?.taskNameRead();
    if (!taskNameContext) {
      this.addDiagnostic(ctx, 'Task name is required for configuration', DiagnosticSeverity.Error);
      return this.visitChildren(ctx) as DocumentSymbolTable;
    }

    const taskName = taskNameContext.getText();
    const taskSymbol = this.findTaskSymbol(taskName);
    if (!taskSymbol) {
      this.addDiagnostic(
        taskNameContext,
        `Task '${taskName}' is not defined`,
        DiagnosticSeverity.Error
      );
      return this.visitChildren(ctx) as DocumentSymbolTable;
    }

    // Store current task for parameter and implementation processing
    const previousScope = this.currentScope;
    this.currentScope = taskSymbol as unknown as ScopedSymbol;
    const result = this.visitChildren(ctx);
    this.currentScope = previousScope;

    return result as DocumentSymbolTable;
  }

  visitImplementation(ctx: ImplementationContext): DocumentSymbolTable {
    if (!(this.currentScope instanceof TaskSymbol)) {
      this.addDiagnostic(
        ctx,
        'Implementation can only be defined within task configuration',
        DiagnosticSeverity.Error
      );
      return this.visitChildren(ctx) as DocumentSymbolTable;
    }

    const stringNode = ctx.STRING();
    if (stringNode) {
      const implementation = this.cleanString(stringNode.getText());
      (this.currentScope as unknown as TaskSymbol).implementation = implementation;
      this.validateFilePath(stringNode, implementation);
    }

    return this.visitChildren(ctx) as DocumentSymbolTable;
  }

  visitParamAssignment(ctx: ParamAssignmentContext): DocumentSymbolTable {
    if (!(this.currentScope instanceof TaskSymbol)) {
      this.addDiagnostic(
        ctx,
        'Parameters can only be defined within task configuration',
        DiagnosticSeverity.Error
      );
      return this.visitChildren(ctx) as DocumentSymbolTable;
    }
    const identifier = ctx.IDENTIFIER();
    if (identifier) {
      const paramName = identifier.getText();
      const taskSymbol = this.currentScope as unknown as TaskSymbol;
      if (taskSymbol.params) {
        taskSymbol.params.push(paramName);
      }
    }

    return this.visitChildren(ctx) as DocumentSymbolTable;
  }

  visitInputStatement(ctx: InputStatementContext): DocumentSymbolTable {
    if (!(this.currentScope instanceof TaskSymbol)) {
      this.addDiagnostic(
        ctx,
        'Input statement can only be defined within task configuration',
        DiagnosticSeverity.Error
      );
      return this.visitChildren(ctx) as DocumentSymbolTable;
    }
    const dataNames = ctx.dataNameList().dataNameRead();
    for (const dataNameCtx of dataNames) {
      const dataName = dataNameCtx.getText();
      const taskSymbol = this.currentScope as unknown as TaskSymbol;
      if (taskSymbol.inputs) {
        taskSymbol.inputs.push(dataName);
      }
      this.validateDataReference(dataNameCtx, dataName);
    }

    return this.visitChildren(ctx) as DocumentSymbolTable;
  }

  visitOutputStatement(ctx: OutputStatementContext): DocumentSymbolTable {
    if (!(this.currentScope instanceof TaskSymbol)) {
      this.addDiagnostic(
        ctx,
        'Output statement can only be defined within task configuration',
        DiagnosticSeverity.Error
      );
      return this.visitChildren(ctx) as DocumentSymbolTable;
    }
    const dataNames = ctx.dataNameList().dataNameRead();
    for (const dataNameCtx of dataNames) {
      const dataName = dataNameCtx.getText();
      const taskSymbol = this.currentScope as unknown as TaskSymbol;
      if (taskSymbol.outputs) {
        taskSymbol.outputs.push(dataName);
      }
    }

    return this.visitChildren(ctx) as DocumentSymbolTable;
  }

  visitWorkflowNameRead(ctx: WorkflowNameReadContext): DocumentSymbolTable {
    const workflowName = ctx.getText();
    this.addWorkflowReference(ctx, workflowName);
    return this.visitChildren(ctx) as DocumentSymbolTable;
  }

  visitDataNameRead(ctx: DataNameReadContext): DocumentSymbolTable {
    const dataName = ctx.getText();
    this.validateDataReference(ctx, dataName);
    return this.visitChildren(ctx) as DocumentSymbolTable;
  }

  visitTaskNameRead(ctx: TaskNameReadContext): DocumentSymbolTable {
    const taskName = ctx.getText();
    this.validateTaskReference(ctx, taskName);
    return this.visitChildren(ctx) as DocumentSymbolTable;
  }

  // Validation methods

  private validateWorkflowNameMatchesFileName(
    identifier: TerminalNode,
    workflowName: string
  ): void {
    const expectedFileName = `${workflowName.toLowerCase()}.xxp`;
    const actualFileName = FileUtils.getFileName(this.document.uri).toLowerCase();

    if (expectedFileName !== actualFileName) {
      this.addDiagnosticForTerminalNode(
        identifier,
        `Workflow name '${workflowName}' does not match file name. Expected '${expectedFileName}'`,
        DiagnosticSeverity.Error
      );
    }
  }

  private validateTaskName(identifier: TerminalNode, taskName: string): void {
    if (taskName === 'START' || taskName === 'END') {
      this.addDiagnosticForTerminalNode(
        identifier,
        `Task name '${taskName}' is reserved`,
        DiagnosticSeverity.Error
      );
    }
  }

  private validateChainElement(element: ChainElementContext): void {
    const taskNameRead = element.taskNameRead();
    if (taskNameRead) {
      const taskName = taskNameRead.getText();
      this.validateTaskReference(taskNameRead, taskName);
    }
  }

  private validateControlFlowRules(elements: ChainElementContext[]): void {
    let hasStart = false;
    let hasEnd = false;
    let endIndex = -1;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (!element) continue;

      if (element.START()) {
        if (hasStart) {
          this.addDiagnostic(
            element,
            'Multiple START elements not allowed in chain',
            DiagnosticSeverity.Error
          );
        }
        hasStart = true;

        if (i !== 0) {
          this.addDiagnostic(
            element,
            'START can only be the first element in chain',
            DiagnosticSeverity.Warning
          );
        }
      }

      if (element.END()) {
        if (hasEnd) {
          this.addDiagnostic(
            element,
            'Multiple END elements not allowed in chain',
            DiagnosticSeverity.Error
          );
        }
        hasEnd = true;
        endIndex = i;
      }
    }

    if (endIndex !== -1 && endIndex !== elements.length - 1) {
      const endElement = elements[endIndex];
      if (endElement) {
        this.addDiagnostic(
          endElement,
          'END should be the last element in chain',
          DiagnosticSeverity.Warning
        );
      }
    }
  }

  private validateTaskReference(ctx: ParserRuleContext, taskName: string): void {
    const taskSymbol = this.findTaskSymbol(taskName);
    if (!taskSymbol && taskName !== 'START' && taskName !== 'END') {
      this.addDiagnostic(ctx, `Task '${taskName}' is not defined`, DiagnosticSeverity.Error);
    } else if (taskSymbol) {
      taskSymbol.addReference(ctx, this.document);
    }
  }

  private validateDataReference(ctx: ParserRuleContext, dataName: string): void {
    const dataSymbol = this.findDataSymbol(dataName);
    if (!dataSymbol) {
      this.addDiagnostic(ctx, `Data '${dataName}' is not defined`, DiagnosticSeverity.Warning);
    } else {
      dataSymbol.addReference(ctx, this.document);
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

  private handleParentWorkflow(
    parentContext: WorkflowNameReadContext,
    workflowSymbol: WorkflowSymbol
  ): void {
    const parentName = parentContext.getText();
    const parentDocument = this.loadParentWorkflowDocument(parentName);

    if (!parentDocument) {
      this.addDiagnostic(
        parentContext,
        `Parent workflow '${parentName}' not found`,
        DiagnosticSeverity.Error
      );
      return;
    }

    const parentWorkflowSymbol = this.findWorkflowInDocument(parentDocument, parentName);
    if (parentWorkflowSymbol) {
      workflowSymbol.parentWorkflow = parentWorkflowSymbol;
      Document.addDocumentDependency(this.document, parentDocument);
    } else {
      this.addDiagnostic(
        parentContext,
        `Parent workflow '${parentName}' not found in document`,
        DiagnosticSeverity.Error
      );
    }
  }

  private loadParentWorkflowDocument(workflowName: string): Document | undefined {
    const parentFileName = `${workflowName.toLowerCase()}.xxp`;
    const parentUri = this.document.uri.replace(/[^/\\]+$/, parentFileName);
    return this.documentManager.loadDocumentFromFileSystem(parentUri);
  }

  private findWorkflowInDocument(
    document: Document,
    workflowName: string
  ): WorkflowSymbol | undefined {
    if (!document.symbolTable) return undefined;

    for (const child of document.symbolTable.children) {
      if (child instanceof WorkflowSymbol && child.name === workflowName) {
        return child;
      }
    }
    return undefined;
  }

  private getExistingWorkflowSymbol(workflowName: string): WorkflowSymbol | undefined {
    for (const child of this.folderSymbolTable.children) {
      if (child instanceof WorkflowSymbol && child.name === workflowName) {
        return child;
      }
    }
    return undefined;
  }

  private findTaskSymbol(taskName: string): TaskSymbol | undefined {
    return this.findSymbolOfType(TaskSymbol, taskName);
  }

  private findDataSymbol(dataName: string): DataSymbol | undefined {
    return this.findSymbolOfType(DataSymbol, dataName);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private findSymbolOfType<T>(type: new (...args: any[]) => T, name: string): T | undefined {
    if (this.currentScope instanceof WorkflowSymbol) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const symbols = this.currentScope.getNestedSymbolsOfTypeSync(type as any);
      return symbols.find(s => s.name === name) as T | undefined;
    }
    return undefined;
  }

  private addWorkflowReference(ctx: ParserRuleContext, workflowName: string): void {
    // First, try to find the workflow in the current document
    let workflowSymbol = this.findWorkflowSymbol(workflowName);

    // If not found locally, try to find it in other documents
    if (!workflowSymbol) {
      const workflowDocument = this.loadParentWorkflowDocument(workflowName);
      if (workflowDocument && workflowDocument.symbolTable) {
        workflowSymbol = this.findWorkflowInDocument(workflowDocument, workflowName);
      }
    }

    // Add reference if symbol found
    if (workflowSymbol) {
      workflowSymbol.addReference(ctx, this.document);
    }
  }

  private findWorkflowSymbol(workflowName: string): WorkflowSymbol | undefined {
    // Search in folder symbol table
    for (const child of this.folderSymbolTable.children) {
      if (child instanceof WorkflowSymbol && child.name === workflowName) {
        return child;
      }
    }
    return undefined;
  }

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
      source: 'XXP',
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
      source: 'XXP',
    });
  }

  private cleanString(str: string): string {
    return str.startsWith('"') && str.endsWith('"') ? str.slice(1, -1) : str;
  }
}
