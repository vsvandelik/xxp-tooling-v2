import * as antlr from 'antlr4ng';
export declare class ParsingErrorListener extends antlr.BaseErrorListener {
    private fileName;
    constructor(fileName: string);
    syntaxError<S extends antlr.Token, T extends antlr.ATNSimulator>(recognizer: antlr.Recognizer<T>, offendingSymbol: S | null, line: number, column: number, msg: string, e: antlr.RecognitionException | null): void;
}
//# sourceMappingURL=ParsingErrorListener.d.ts.map