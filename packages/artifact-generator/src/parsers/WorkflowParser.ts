import * as fs from 'fs';
import * as antlr from 'antlr4ng';
import { XXPLexer, XXPParser } from '@extremexp/core';
import { WorkflowModel } from '../models/WorkflowModel.js';
import { WorkflowModelVisitor } from '../visitors/WorkflowModelVisitor.js';
import { ParsingErrorListener } from '../visitors/ParsingErrorListener.js';

export class WorkflowParser {
  async parse(filePath: string): Promise<WorkflowModel> {
    const content = fs.readFileSync(filePath, 'utf8');
    const input = antlr.CharStream.fromString(content);
    const lexer = new XXPLexer(input);
    const tokens = new antlr.CommonTokenStream(lexer);
    const parser = new XXPParser(tokens);

    // Remove default error listeners and add our custom one
    parser.removeErrorListeners();
    lexer.removeErrorListeners();

    const errorListener = new ParsingErrorListener(filePath);
    parser.addErrorListener(errorListener);
    lexer.addErrorListener(errorListener);

    const tree = parser.program();
    const visitor = new WorkflowModelVisitor();

    return visitor.visit(tree) as WorkflowModel;
  }
}
