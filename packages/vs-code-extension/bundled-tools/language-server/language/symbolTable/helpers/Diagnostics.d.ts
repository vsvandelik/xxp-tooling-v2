import { ParserRuleContext, TerminalNode } from 'antlr4ng';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
type BuilderType = XxpSymbolTableBuilder | EspaceSymbolTableBuilder;
export declare function addDiagnostic(builder: BuilderType, ctx: ParserRuleContext, message: string, severity?: DiagnosticSeverity): void;
export declare function addDiagnosticForTerminalNode(builder: BuilderType, node: TerminalNode, message: string, severity?: DiagnosticSeverity): void;
export declare function addDiagnosticAndContinue(builder: BuilderType, ctx: ParserRuleContext, message: string): any;
export {};
//# sourceMappingURL=Diagnostics.d.ts.map