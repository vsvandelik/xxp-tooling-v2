import { BaseErrorListener, RecognitionException, Recognizer, Token } from 'antlr4ng';
import { Diagnostic } from 'vscode-languageserver';
export declare class DiagnosticReportingErrorListener extends BaseErrorListener {
    private diagnostics;
    private logger;
    constructor(diagnostics: Diagnostic[]);
    syntaxError(recognizer: Recognizer<any>, offendingSymbol: Token | null, line: number, charPositionInLine: number, msg: string, e: RecognitionException | null): void;
}
//# sourceMappingURL=DiagnosticReportingErrorListener.d.ts.map