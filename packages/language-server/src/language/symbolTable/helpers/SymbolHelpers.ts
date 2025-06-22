import { BaseSymbol, ScopedSymbol, DuplicateSymbolError } from 'antlr4-c3';
import { ParserRuleContext } from 'antlr4ng';
import { TerminalSymbolWithReferences } from '../../../core/models/symbols/TerminalSymbolWithReferences.js';
import { addDiagnostic } from './Diagnostics.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import { ScopeSymbolWithSymbolReference } from '../../../core/models/symbols/ScopeSymbolWithSymbolReference.js';
import { ScopedParserRuleContext } from '../types.js';
import { WorkflowSymbol } from '../../../core/models/symbols/WorkflowSymbol.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';

type BuilderType = XxpSymbolTableBuilder | EspaceSymbolTableBuilder;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function addSymbolOfTypeWithContext<T extends BaseSymbol>(
  builder: BuilderType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: new (...args: any[]) => T,
  name: string,
  ctx: ParserRuleContext,
  scope: ScopedSymbol = builder.currentScope,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
): T | undefined {
  try {
    const symbol = builder.symbolTable.addNewSymbolOfType(type, scope, name, ...args);
    symbol.context = ctx;
    return symbol;
  } catch (error) {
    if (error instanceof DuplicateSymbolError) {
      addDiagnostic(builder, ctx, `Duplicate name '${name}'`);
    }
  }
  return undefined;
}

/**
 * Adds a symbol while checking for conflicts in inheritance hierarchy.
 * For data and task symbols, checks if a symbol with the same name exists in parent workflows.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function addSymbolOfTypeWithInheritanceCheck<T extends BaseSymbol>(
  builder: BuilderType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: new (...args: any[]) => T,
  name: string,
  ctx: ParserRuleContext,
  symbolType: string,
  scope: ScopedSymbol = builder.currentScope,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
): T | undefined {
  if (scope instanceof WorkflowSymbol && scope.parentWorkflowSymbol) {
    const parentSymbol = scope.parentWorkflowSymbol.resolveSync(name, true); // Check only parent locally
    if (parentSymbol && parentSymbol.name === name) {
      addDiagnostic(builder, ctx, `Cannot override ${symbolType} '${name}' from parent workflow`);
      return undefined;
    }
  }

  // Proceed with normal symbol addition
  return addSymbolOfTypeWithContext(builder, type, name, ctx, scope, ...args);
}

export function visitScopeSymbol<T extends ScopeSymbolWithSymbolReference>(
  builder: BuilderType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: new (...args: any[]) => T,
  ctx: ScopedParserRuleContext,
  symbolReference?: TerminalSymbolWithReferences
) {
  const originalScope = builder.currentScope;

  const scopeName = (originalScope.children.length ?? 0) + 1;
  const newScopeSymbol = addSymbolOfTypeWithContext(
    builder,
    type,
    scopeName.toString(),
    ctx,
    originalScope,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    symbolReference as any
  );
  if (!newScopeSymbol) {
    return builder.defaultResult();
  }

  builder.currentScope = newScopeSymbol;
  try {
    return builder.visitChildren(ctx) as unknown as T;
  } finally {
    builder.currentScope = originalScope;
  }
}
