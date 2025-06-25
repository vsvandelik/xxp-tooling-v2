import { BaseSymbol, ScopedSymbol } from 'antlr4-c3';
import { ParserRuleContext } from 'antlr4ng';
import { TerminalSymbolWithReferences } from '../../../core/models/symbols/TerminalSymbolWithReferences.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import { ScopeSymbolWithSymbolReference } from '../../../core/models/symbols/ScopeSymbolWithSymbolReference.js';
import { ScopedParserRuleContext } from '../types.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
type BuilderType = XxpSymbolTableBuilder | EspaceSymbolTableBuilder;
export declare function addSymbolOfTypeWithContext<T extends BaseSymbol>(builder: BuilderType, type: new (...args: any[]) => T, name: string, ctx: ParserRuleContext, scope?: ScopedSymbol, ...args: any[]): T | undefined;
export declare function addSymbolOfTypeWithInheritanceCheck<T extends BaseSymbol>(builder: BuilderType, type: new (...args: any[]) => T, name: string, ctx: ParserRuleContext, symbolType: string, scope?: ScopedSymbol, ...args: any[]): T | undefined;
export declare function visitScopeSymbol<T extends ScopeSymbolWithSymbolReference>(builder: BuilderType, type: new (...args: any[]) => T, ctx: ScopedParserRuleContext, symbolReference?: TerminalSymbolWithReferences): import("../DocumentSymbolTable.js").DocumentSymbolTable | T;
export {};
//# sourceMappingURL=SymbolHelpers.d.ts.map