import { BaseErrorListener } from 'antlr4ng';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { Logger } from '../../utils/Logger.js';
export class DiagnosticReportingErrorListener extends BaseErrorListener {
    diagnostics;
    logger = Logger.getLogger();
    constructor(diagnostics) {
        super();
        this.diagnostics = diagnostics;
    }
    syntaxError(recognizer, offendingSymbol, line, charPositionInLine, msg, e) {
        const endChar = offendingSymbol?.text
            ? charPositionInLine + offendingSymbol.text.length
            : charPositionInLine + 1;
        this.logger.debug(`Syntax error: ${msg} at line ${line}, char ${charPositionInLine}`);
        this.diagnostics.push({
            range: {
                start: { line: line - 1, character: charPositionInLine },
                end: { line: line - 1, character: endChar },
            },
            message: msg,
            severity: DiagnosticSeverity.Error,
        });
    }
}
//# sourceMappingURL=DiagnosticReportingErrorListener.js.map