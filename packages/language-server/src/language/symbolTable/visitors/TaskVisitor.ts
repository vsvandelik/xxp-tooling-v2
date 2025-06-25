import { TaskConfigurationScopeSymbol } from '../../../core/models/symbols/TaskConfigurationScopeSymbol.js';
import { TaskSymbol } from '../../../core/models/symbols/TaskSymbol.js';
import { ParamSymbol } from '../../../core/models/symbols/ParamSymbol.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addSymbolOfTypeWithInheritanceCheck, addSymbolOfTypeWithContext, visitScopeSymbol } from '../helpers/SymbolHelpers.js';
import { addDiagnostic } from '../helpers/Diagnostics.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { Param } from '../../../core/models/Param.js';
import {
  XxpTaskConfigurationContext,
  XxpParamAssignmentContext,
  XxpTaskDefinitionContext,
  XxpImplementationContext,
  XxpInputStatementContext,
  XxpOutputStatementContext,
} from '@extremexp/core';

export class TaskVisitor {
  constructor(private readonly builder: XxpSymbolTableBuilder) {}

  public visitDefinition(ctx: XxpTaskDefinitionContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const taskName = identifier.getText();
    if (!taskName) return this.builder.defaultResult();

    const taskSymbol = addSymbolOfTypeWithInheritanceCheck(
      this.builder,
      TaskSymbol,
      taskName,
      ctx,
      'task',
      this.builder.currentScope,
      this.builder.document
    );
    if (!taskSymbol) return this.builder.defaultResult();

    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }

  public visitConfiguration(ctx: XxpTaskConfigurationContext): DocumentSymbolTable {
    const nameContext = ctx.taskConfigurationHeader()?.taskNameRead();
    if (!nameContext) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const taskName = nameContext.getText();
    const taskSymbol = this.getTaskSymbolByName(taskName);
    if (!taskSymbol) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    this.builder.visitChildren(ctx.taskConfigurationHeader()!);

    // Don't allow configuring START and END tasks
    if (taskName === 'START' || taskName === 'END') {
      addDiagnostic(
        this.builder,
        nameContext,
        `Cannot configure reserved task '${taskName}'. START and END tasks are predefined and cannot be configured.`,
        DiagnosticSeverity.Error
      );
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    return visitScopeSymbol(
      this.builder,
      TaskConfigurationScopeSymbol,
      ctx.taskConfigurationBody(),
      taskSymbol
    ) as DocumentSymbolTable;
  }

  public visitImplementation(ctx: XxpImplementationContext): DocumentSymbolTable {
    const fileContext = ctx.fileNameString();
    if (!fileContext) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const taskSymbol = this.getTaskSymbolFromCurrentScope();
    if (!taskSymbol) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    /*
		TODO:
		- Warning when overriding an existing implementation (defined here or in parent workflow)
		*/

    taskSymbol.implementation = fileContext.getText();
    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }

  public visitParam(ctx: XxpParamAssignmentContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const taskSymbol = this.getTaskSymbolFromCurrentScope();
    if (!taskSymbol) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const paramName = identifier.getText();
    const hasValue = ctx.expression() !== undefined;

    // Create ParamSymbol and add it to the symbol table
    const paramSymbol = addSymbolOfTypeWithContext(
      this.builder,
      ParamSymbol,
      paramName,
      ctx,
      this.builder.currentScope,  // Add to current scope (TaskConfigurationScopeSymbol)
      this.builder.document
    );

    /*
		TODO:
		- Warning when overriding an existing implementation (defined here or in parent workflow)
		*/

    // Also add to TaskSymbol for backward compatibility
    taskSymbol.params.push(new Param(paramName, hasValue));
    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }

  public visitInput(ctx: XxpInputStatementContext): DocumentSymbolTable {
    const taskSymbol = this.getTaskSymbolFromCurrentScope();
    if (!taskSymbol) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const dataIdentifiers = ctx.dataNameList()?.dataNameRead();
    if (!dataIdentifiers || dataIdentifiers.length === 0) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    for (const dataIdentifier of dataIdentifiers) {
      const dataName = dataIdentifier.getText();
      if (!dataName) continue;

      taskSymbol.inputData.push(dataName);
    }

    /* TODO:
		- Warning when input data is already defined in the task (defined here or in parent workflow)
		*/

    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }

  public visitOutput(ctx: XxpOutputStatementContext): DocumentSymbolTable {
    const taskSymbol = this.getTaskSymbolFromCurrentScope();
    if (!taskSymbol) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const dataIdentifiers = ctx.dataNameList()?.dataNameRead();
    if (!dataIdentifiers || dataIdentifiers.length === 0) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    for (const dataIdentifier of dataIdentifiers) {
      const dataName = dataIdentifier.getText();
      if (!dataName) continue;

      taskSymbol.outputData.push(dataName);
    }

    /* TODO:
		- Warning when output data is already defined in the task (defined here or in parent workflow)
		*/

    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }

  private getTaskSymbolByName(taskName: string): TaskSymbol | undefined {
    const symbols = (
      this.builder.currentScope?.getNestedSymbolsOfTypeSync(TaskSymbol) ?? []
    ).filter(symbol => symbol.name === taskName);
    return symbols.length === 1 ? symbols[0] : undefined;
  }

  private getTaskSymbolFromCurrentScope(): TaskSymbol | undefined {
    if (
      !(this.builder.currentScope instanceof TaskConfigurationScopeSymbol) ||
      !this.builder.currentScope.symbolReference
    ) {
      return undefined;
    }
    return this.builder.currentScope.symbolReference as TaskSymbol;
  }
}
