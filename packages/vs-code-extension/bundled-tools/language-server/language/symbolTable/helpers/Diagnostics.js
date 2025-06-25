import { DiagnosticSeverity } from 'vscode-languageserver';
import { Logger } from '../../../utils/Logger.js';
const logger = Logger.getLogger();
export function addDiagnostic(builder, ctx, message, severity = DiagnosticSeverity.Error) {
    if (!ctx.start || !ctx.stop)
        return;
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
export function addDiagnosticForTerminalNode(builder, node, message, severity = DiagnosticSeverity.Error) {
    if (!node.symbol.start || !node.symbol.stop)
        return;
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
export function addDiagnosticAndContinue(builder, ctx, message) {
    addDiagnostic(builder, ctx, message);
    return builder.visitChildren(ctx);
}
//# sourceMappingURL=Diagnostics.js.map