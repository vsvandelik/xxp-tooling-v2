import { ESPACEParser, ESPACELexer } from '@extremexp/core';
import * as fs from 'fs';
import * as antlr from 'antlr4ng';
import { ExperimentModelVisitor } from '../visitors/ExperimentModelVisitor.js';
import { ParsingErrorListener } from '../visitors/ParsingErrorListener.js';
export class ExperimentParser {
    async parse(espaceFileName) {
        const content = await fs.promises.readFile(espaceFileName, 'utf-8');
        const input = antlr.CharStream.fromString(content);
        const lexer = new ESPACELexer(input);
        const tokens = new antlr.CommonTokenStream(lexer);
        const parser = new ESPACEParser(tokens);
        parser.removeErrorListeners();
        lexer.removeErrorListeners();
        const errorListener = new ParsingErrorListener(espaceFileName);
        parser.addErrorListener(errorListener);
        lexer.addErrorListener(errorListener);
        const tree = parser.program();
        const visitor = new ExperimentModelVisitor();
        return visitor.visit(tree);
    }
}
//# sourceMappingURL=ExperimentParser.js.map