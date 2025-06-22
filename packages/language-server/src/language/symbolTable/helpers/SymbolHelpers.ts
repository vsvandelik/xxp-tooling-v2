import { BaseSymbol, ScopedSymbol, DuplicateSymbolError } from 'antlr4-c3';
import { ParserRuleContext } from 'antlr4ng';
import { TaskConfigurationScopeSymbol } from '../../../core/models/symbols/TaskConfigurationScopeSymbol.js';
import { TaskSymbol } from '../../../core/models/symbols/TaskSymbol.js';
import { TerminalSymbolWithReferences } from '../../../core/models/symbols/TerminalSymbolWithReferences.js';
import { addDiagnostic } from './Diagnostics.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import { ScopeSymbolWithSymbolReference } from '../../../core/models/symbols/ScopeSymbolWithSymbolReference.js';
import { ScopedParserRuleContext } from '../types.js';

export function addSymbolOfTypeWithContext<T extends BaseSymbol>(
  builder: XxpSymbolTableBuilder,
  type: new (...args: any[]) => T,
  name: string,
  ctx: ParserRuleContext,
  scope: ScopedSymbol = builder.currentScope,
  ...args: unknown[]
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

export function visitScopeSymbol<T extends ScopeSymbolWithSymbolReference>(
  builder: XxpSymbolTableBuilder,
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
    symbolReference as any
  );
  if (!newScopeSymbol) {
    return builder.defaultResult();
  }

  builder.currentScope = newScopeSymbol;
  try {
    return builder.visitChildren(ctx) as any;
  } finally {
    builder.currentScope = originalScope;
  }
}
