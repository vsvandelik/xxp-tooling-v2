import * as fs from 'fs';
import * as antlr from 'antlr4ng';
import { XXPLexer, XXPParser } from '@extremexp/core';
import { WorkflowModelVisitor } from '../visitors/WorkflowModelVisitor.js';
import { ParsingErrorListener } from '../visitors/ParsingErrorListener.js';
export class WorkflowParser {
    async parse(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const input = antlr.CharStream.fromString(content);
        const lexer = new XXPLexer(input);
        const tokens = new antlr.CommonTokenStream(lexer);
        const parser = new XXPParser(tokens);
        parser.removeErrorListeners();
        lexer.removeErrorListeners();
        const errorListener = new ParsingErrorListener(filePath);
        parser.addErrorListener(errorListener);
        lexer.addErrorListener(errorListener);
        const tree = parser.program();
        const visitor = new WorkflowModelVisitor();
        return visitor.visit(tree);
    }
}
//# sourceMappingURL=WorkflowParser.js.map