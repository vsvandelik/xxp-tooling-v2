/**
 * Parser for XXP workflow files.
 * Converts XXP syntax into structured workflow models.
 */

import * as fs from 'fs';

import { XXPLexer, XXPParser } from '@extremexp/core';
import * as antlr from 'antlr4ng';

import { WorkflowModel } from '../models/WorkflowModel.js';
import { ParsingErrorListener } from '../visitors/ParsingErrorListener.js';
import { WorkflowModelVisitor } from '../visitors/WorkflowModelVisitor.js';

/**
 * Parser for XXP workflow definition files.
 * Uses ANTLR-generated lexer and parser to convert XXP syntax into structured models.
 */
export class WorkflowParser {
  /**
   * Parses an XXP workflow file into a WorkflowModel.
   *
   * @param filePath - Path to the XXP workflow file
   * @returns Promise resolving to the parsed workflow model
   * @throws Error if the file cannot be read or contains syntax errors
   */
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
