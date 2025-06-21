import {
  ANTLRErrorListener,
  ATNSimulator,
  RecognitionException,
  Recognizer,
  Token,
} from 'antlr4ng';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node.js';

export class ErrorListener implements ANTLRErrorListener {
  constructor(private diagnostics: Diagnostic[]) {}

  syntaxError<S extends Token, T extends ATNSimulator>(
    recognizer: Recognizer<T>,
    offendingSymbol: S | null,
    line: number,
    charPositionInLine: number,
    msg: string,
    e: RecognitionException | null
  ): void {
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
      range: {
        start: {
          line: line - 1, // Convert to 0-based
          character: charPositionInLine,
        },
        end: {
          line: line - 1,
          character: charPositionInLine + (offendingSymbol?.text?.length || 1),
        },
      },
      message: msg,
      source: 'extremexp',
    };

    this.diagnostics.push(diagnostic);
  }

  reportAmbiguity(
    recognizer: unknown,
    dfa: unknown,
    startIndex: number,
    stopIndex: number,
    exact: boolean,
    ambigAlts: unknown,
    configs: unknown
  ): void {
    // Optionally handle ambiguities
  }

  reportAttemptingFullContext(
    recognizer: unknown,
    dfa: unknown,
    startIndex: number,
    stopIndex: number,
    conflictingAlts: unknown,
    configs: unknown
  ): void {
    // Optionally handle full context attempts
  }

  reportContextSensitivity(
    recognizer: unknown,
    dfa: unknown,
    startIndex: number,
    stopIndex: number,
    prediction: number,
    configs: unknown
  ): void {
    // Optionally handle context sensitivity
  }
}
