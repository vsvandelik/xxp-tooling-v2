import * as antlr from 'antlr4ng';
import path from 'path';

export class ParsingErrorListener extends antlr.BaseErrorListener {
  constructor(private fileName: string) {
    super();
  }

  override syntaxError<S extends antlr.Token, T extends antlr.ATNSimulator>(
    recognizer: antlr.Recognizer<T>,
    offendingSymbol: S | null,
    line: number,
    column: number,
    msg: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    e: antlr.RecognitionException | null
  ): void {
    throw new Error(
      `Parsing error in file "${path.basename(this.fileName)}" at line ${line}, column ${column}: ${msg}`
    );
  }
}