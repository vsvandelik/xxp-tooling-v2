import { BaseErrorListener, RecognitionException, Recognizer, Token } from 'antlr4ng';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';

import { Logger } from '../../utils/Logger.js';

export class DiagnosticReportingErrorListener extends BaseErrorListener {
  private logger = Logger.getLogger();

  constructor(private diagnostics: Diagnostic[]) {
    super();
  }

  override syntaxError(
    recognizer: Recognizer<any>,
    offendingSymbol: Token | null,
    line: number,
    charPositionInLine: number,
    msg: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
    e: RecognitionException | null
  ): void {
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
