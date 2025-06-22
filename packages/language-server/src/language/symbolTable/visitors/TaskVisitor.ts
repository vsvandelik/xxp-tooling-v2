import { TaskConfigurationScopeSymbol } from '../../../core/models/symbols/TaskConfigurationScopeSymbol.js';
import { TaskSymbol } from '../../../core/models/symbols/TaskSymbol.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addSymbolOfTypeWithContext, visitScopeSymbol } from '../helpers/SymbolHelpers.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import {
  ImplementationContext,
  ParamAssignmentContext,
  TaskConfigurationContext,
  TaskDefinitionContext,
} from '@extremexp/core';
import { Param } from '../../../core/models/Param.js';
import {
  InputStatementContext,
  OutputStatementContext,
} from '@extremexp/core/src/language/generated/XXPParser.js';

export class TaskVisitor {
  constructor(private readonly builder: XxpSymbolTableBuilder) {}

  public visitDefinition(ctx: TaskDefinitionContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const taskName = identifier.getText();
    if (!taskName) return this.builder.defaultResult();

    const taskSymbol = addSymbolOfTypeWithContext(
      this.builder,
      TaskSymbol,
      taskName,
      ctx,
      this.builder.currentScope,
      this.builder.document
    );
    if (!taskSymbol) return this.builder.defaultResult();

    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }

  public visitConfiguration(ctx: TaskConfigurationContext): DocumentSymbolTable {
    const nameContext = ctx.taskConfigurationHeader()?.taskNameRead();
    if (!nameContext) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const taskSymbol = this.getTaskSymbolByName(nameContext.getText());
    if (!taskSymbol) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    this.builder.visitChildren(ctx.taskConfigurationHeader()!);

    return visitScopeSymbol(
      this.builder,
      TaskConfigurationScopeSymbol,
      ctx.taskConfigurationBody(),
      taskSymbol
    );
  }

  public visitImplementation(ctx: ImplementationContext): DocumentSymbolTable {
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

  public visitParam(ctx: ParamAssignmentContext): DocumentSymbolTable {
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

    /*
		TODO:
		- Warning when overriding an existing implementation (defined here or in parent workflow)
		*/

    taskSymbol.params.push(new Param(paramName, hasValue));
    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }

  public visitInput(ctx: InputStatementContext): DocumentSymbolTable {
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

  public visitOutput(ctx: OutputStatementContext): DocumentSymbolTable {
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
