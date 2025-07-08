import { EspaceTaskConfigurationContext, EspaceParamAssignmentContext } from '@extremexp/core';

import { SpaceScopeSymbol } from '../../../core/models/symbols/SpaceScopeSymbol.js';
import { SpaceSymbol } from '../../../core/models/symbols/SpaceSymbol.js';
import { TaskConfigurationScopeSymbol } from '../../../core/models/symbols/TaskConfigurationScopeSymbol.js';
import { TaskSymbol } from '../../../core/models/symbols/TaskSymbol.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addDiagnostic } from '../helpers/Diagnostics.js';
import { visitScopeSymbol } from '../helpers/SymbolHelpers.js';

export class EspaceTaskConfigurationVisitor {
  constructor(private readonly builder: EspaceSymbolTableBuilder) {}

  public visitConfiguration(ctx: EspaceTaskConfigurationContext): DocumentSymbolTable {
    const nameContext = ctx.taskConfigurationHeader()?.taskNameRead();
    if (!nameContext) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const taskName = nameContext.getText();
    const taskSymbol = this.getTaskSymbolByName(taskName);

    if (!taskSymbol) {
      // Task might be defined in the referenced workflow
      const workflowSymbol = this.getReferencedWorkflowSymbol();
      if (!workflowSymbol) {
        addDiagnostic(this.builder, nameContext, `Task '${taskName}' is not defined`);
        return this.builder.visitChildren(ctx) as DocumentSymbolTable;
      }

      // Check if task exists in the workflow
      const workflowTask = workflowSymbol.resolveSync(taskName);
      if (!workflowTask || !(workflowTask instanceof TaskSymbol)) {
        addDiagnostic(
          this.builder,
          nameContext,
          `Task '${taskName}' is not defined in the referenced workflow`
        );
        return this.builder.visitChildren(ctx) as DocumentSymbolTable;
      }
    }

    this.builder.visitChildren(ctx.taskConfigurationHeader()!);

    return visitScopeSymbol(
      this.builder,
      TaskConfigurationScopeSymbol,
      ctx.taskConfigurationBody(),
      taskSymbol
    ) as DocumentSymbolTable;
  }

  public visitParamAssignment(ctx: EspaceParamAssignmentContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    const paramValue = ctx.paramValue();

    if (!identifier || !paramValue) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    // In ESPACE, task configuration params are just stored, not added to the task symbol
    // since tasks are defined in the referenced workflow

    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }

  private getTaskSymbolByName(taskName: string): TaskSymbol | undefined {
    const symbols = (
      this.builder.currentScope?.getNestedSymbolsOfTypeSync(TaskSymbol) ?? []
    ).filter(symbol => symbol.name === taskName);
    return symbols.length === 1 ? symbols[0] : undefined;
  }

  private getReferencedWorkflowSymbol(): any | undefined {
    // Find the parent space scope
    let scope = this.builder.currentScope;
    while (scope && !(scope instanceof SpaceScopeSymbol)) {
      scope = scope.parent as any;
    }

    if (scope instanceof SpaceScopeSymbol && scope.symbolReference instanceof SpaceSymbol) {
      return scope.symbolReference.workflowReference;
    }

    return undefined;
  }
}
