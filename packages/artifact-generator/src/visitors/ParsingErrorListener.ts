/**
 * Custom error listener for ANTLR parsing errors.
 * Provides enhanced error messages with file context and location information.
 */

import path from 'path';

import * as antlr from 'antlr4ng';

/**
 * Custom ANTLR error listener that provides enhanced error reporting.
 * Includes file names and precise location information in error messages.
 */
export class ParsingErrorListener extends antlr.BaseErrorListener {
  /**
   * Creates a new parsing error listener.
   * 
   * @param fileName - Name of the file being parsed for error context
   */
  constructor(private fileName: string) {
    super();
  }

  /**
   * Handles syntax errors during parsing by throwing detailed error messages.
   * 
   * @param recognizer - The ANTLR recognizer that encountered the error
   * @param offendingSymbol - The token that caused the error
   * @param line - Line number where the error occurred
   * @param column - Column number where the error occurred  
   * @param msg - Error message from ANTLR
   * @param _e - Recognition exception (unused)
   * @throws Error with detailed location and context information
   */
  override syntaxError<S extends antlr.Token, T extends antlr.ATNSimulator>(
    recognizer: antlr.Recognizer<T>,
    offendingSymbol: S | null,
    line: number,
    column: number,
    msg: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _e: antlr.RecognitionException | null
  ): void {
    throw new Error(
      `Parsing error in file "${path.basename(this.fileName)}" at line ${line}, column ${column}: ${msg}`
    );
  }
}
