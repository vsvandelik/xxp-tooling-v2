import * as antlr from 'antlr4ng';
import path from 'path';
export class ParsingErrorListener extends antlr.BaseErrorListener {
    fileName;
    constructor(fileName) {
        super();
        this.fileName = fileName;
    }
    syntaxError(recognizer, offendingSymbol, line, column, msg, e) {
        throw new Error(`Parsing error in file "${path.basename(this.fileName)}" at line ${line}, column ${column}: ${msg}`);
    }
}
//# sourceMappingURL=ParsingErrorListener.js.map