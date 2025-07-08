import { ParserRuleContext, TerminalNode } from 'antlr4ng';
import { DiagnosticSeverity } from 'vscode-languageserver';

import { Logger } from '../../../utils/Logger.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';

type BuilderType = XxpSymbolTableBuilder | EspaceSymbolTableBuilder;

const logger = Logger.getLogger();

export function addDiagnostic(
  builder: BuilderType,
  ctx: ParserRuleContext,
  message: string,
  severity: DiagnosticSeverity = DiagnosticSeverity.Error
): void {
  if (!ctx.start || !ctx.stop) return;

  logger.debug(`Diagnostic: ${message}`);
  builder.document.diagnostics?.push({
    severity,
    range: {
      start: { line: ctx.start.line - 1, character: ctx.start.column },
      end: { line: ctx.stop.line - 1, character: ctx.stop.column + ctx.getText().length },
    },
    message,
  });
}

export function addDiagnosticForTerminalNode(
  builder: BuilderType,
  node: TerminalNode,
  message: string,
  severity: DiagnosticSeverity = DiagnosticSeverity.Error
): void {
  if (!node.symbol.start || !node.symbol.stop) return;

  logger.debug(`Diagnostic: ${message}`);
  builder.document.diagnostics?.push({
    severity,
    range: {
      start: { line: node.symbol.line - 1, character: node.symbol.column },
      end: { line: node.symbol.line - 1, character: node.symbol.column + node.getText().length },
    },
    message,
  });
}

export function addDiagnosticAndContinue(
  builder: BuilderType,
  ctx: ParserRuleContext,
  message: string
) {
  addDiagnostic(builder, ctx, message);
  return builder.visitChildren(ctx) as any;
}
