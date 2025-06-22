import { BaseSymbol } from 'antlr4-c3';
import { DataSymbol } from '../../../core/models/symbols/DataSymbol.js';
import { TaskSymbol } from '../../../core/models/symbols/TaskSymbol.js';
import { SpaceSymbol } from '../../../core/models/symbols/SpaceSymbol.js';
import { WorkflowSymbol } from '../../../core/models/symbols/WorkflowSymbol.js';
import { TerminalSymbolWithReferences } from '../../../core/models/symbols/TerminalSymbolWithReferences.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addDiagnosticAndContinue } from '../helpers/Diagnostics.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import {
  EspaceWorkflowNameReadContext,
  EspaceTaskNameReadContext,
  EspaceSpaceNameReadContext,
} from '@extremexp/core';

export class EspaceVariableReadVisitor {
  constructor(private readonly builder: EspaceSymbolTableBuilder) {}

  public visitWorkflow(ctx: EspaceWorkflowNameReadContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) return this.builder.visitChildren(ctx) as DocumentSymbolTable;

    const workflowName = identifier.getText();

    // In ESPACE, workflows are referenced from external files
    // We don't validate them here as they're validated in SpaceVisitor

    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }

  public visitTask(ctx: EspaceTaskNameReadContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) return this.builder.visitChildren(ctx) as DocumentSymbolTable;

    return this.visitSymbolRead(TaskSymbol, ctx, 'Task');
  }

  public visitSpace(ctx: EspaceSpaceNameReadContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) return this.builder.visitChildren(ctx) as DocumentSymbolTable;

    return this.visitSymbolRead(SpaceSymbol, ctx, 'Space');
  }

  private visitSymbolRead<T extends BaseSymbol>(
    type: new (...args: any[]) => T,
    ctx: EspaceWorkflowNameReadContext | EspaceTaskNameReadContext | EspaceSpaceNameReadContext,
    prefix: string
  ): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) return this.builder.visitChildren(ctx) as DocumentSymbolTable;

    const identifierText = identifier.getText();
    const symbol = this.builder.currentScope.resolveSync(identifierText);

    if (!symbol || !(symbol instanceof type)) {
      // For tasks, check in the referenced workflow
      if (prefix === 'Task' && ctx instanceof EspaceTaskNameReadContext) {
        const workflowSymbol = this.getReferencedWorkflowSymbol();
        if (workflowSymbol) {
          const workflowTask = workflowSymbol.resolveSync(identifierText);
          if (workflowTask && workflowTask instanceof TaskSymbol) {
            if (workflowTask instanceof TerminalSymbolWithReferences) {
              workflowTask.addReference(identifier, this.builder.document);
            }
            return this.builder.visitChildren(ctx) as DocumentSymbolTable;
          }
        }
      }

      return addDiagnosticAndContinue(
        this.builder,
        ctx,
        `${prefix} '${identifierText}' is not defined`
      );
    }

    const matchedSymbol = symbol;
    if (matchedSymbol instanceof TerminalSymbolWithReferences) {
      matchedSymbol.addReference(identifier, this.builder.document);
    } else if (matchedSymbol instanceof WorkflowSymbol) {
      matchedSymbol.addReference(identifier, this.builder.document);
    }

    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }

  private getReferencedWorkflowSymbol(): WorkflowSymbol | undefined {
    // Find the parent space scope
    let scope = this.builder.currentScope;
    while (scope) {
      const spaces = scope.getNestedSymbolsOfTypeSync(SpaceSymbol);
      if (spaces.length > 0) {
        const space = spaces[0];
        return space!.workflowReference;
      }
      scope = scope.parent as any;
    }

    return undefined;
  }
}
