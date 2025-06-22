import { BaseErrorListener, RecognitionException, Recognizer, Token } from 'antlr4ng';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';

export class DiagnosticReportingErrorListener extends BaseErrorListener {
    constructor(private diagnostics: Diagnostic[]) {
        super();
    }

    override syntaxError(
        recognizer: Recognizer<any>,
        offendingSymbol: Token | null,
        line: number,
        charPositionInLine: number,
        msg: string,
        e: RecognitionException | null
    ): void {
        const endChar = offendingSymbol?.text
            ? charPositionInLine + offendingSymbol.text.length
            : charPositionInLine + 1;

        this.diagnostics.push({
            range: {
                start: { line: line - 1, character: charPositionInLine },
                end: { line: line - 1, character: endChar }
            },
            message: msg,
            severity: DiagnosticSeverity.Error
        });
    }
}