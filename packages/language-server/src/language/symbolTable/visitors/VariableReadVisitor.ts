import { BaseSymbol } from 'antlr4-c3';

import { DataSymbol } from '../../../core/models/symbols/DataSymbol.js';
import { TaskSymbol } from '../../../core/models/symbols/TaskSymbol.js';
import { TerminalSymbolWithReferences } from '../../../core/models/symbols/TerminalSymbolWithReferences.js';
import { WorkflowSymbol } from '../../../core/models/symbols/WorkflowSymbol.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addDiagnosticAndContinue } from '../helpers/Diagnostics.js';
import { ReadNameContext } from '../types.js';

export class VariableReadVisitor {
  constructor(private readonly builder: XxpSymbolTableBuilder) {}

  public visitWorkflow(ctx: ReadNameContext): DocumentSymbolTable {
    if (ctx.IDENTIFIER() === null) return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    return this.visitSymbolRead(WorkflowSymbol, ctx, 'Workflow');
  }

  public visitData(ctx: ReadNameContext): DocumentSymbolTable {
    if (ctx.IDENTIFIER() === null) return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    return this.visitSymbolRead(DataSymbol, ctx, 'Data variable');
  }

  public visitTask(ctx: ReadNameContext): DocumentSymbolTable {
    if (ctx.IDENTIFIER() === null) return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    return this.visitSymbolRead(TaskSymbol, ctx, 'Task variable');
  }

  private visitSymbolRead<T extends BaseSymbol>(
    type: new (...args: any[]) => T,
    ctx: ReadNameContext,
    prefix: string
  ): DocumentSymbolTable {
    const identifierText = ctx.IDENTIFIER().getText();
    const symbol = this.builder.currentScope.resolveSync(identifierText);

    if (symbol === null || symbol === undefined || !(symbol instanceof type)) {
      return addDiagnosticAndContinue(
        this.builder,
        ctx,
        `${prefix} '${identifierText}' is not defined`
      );
    }

    const matchedSymbol = symbol;
    if (matchedSymbol instanceof TerminalSymbolWithReferences) {
      matchedSymbol.addReference(ctx.IDENTIFIER(), this.builder.document);
    } else if (matchedSymbol instanceof WorkflowSymbol) {
      matchedSymbol.addReference(ctx.IDENTIFIER(), this.builder.document);
    }

    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }
}
