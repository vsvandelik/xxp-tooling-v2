/**
 * Parser for ESPACE experiment files.
 * Converts ESPACE syntax into structured experiment models.
 */

import * as fs from 'fs';

import { ESPACEParser, ESPACELexer } from '@extremexp/core';
import * as antlr from 'antlr4ng';

import { ExperimentModel } from '../models/ExperimentModel.js';
import { ExperimentModelVisitor } from '../visitors/ExperimentModelVisitor.js';
import { ParsingErrorListener } from '../visitors/ParsingErrorListener.js';

/**
 * Parser for ESPACE experiment definition files.
 * Uses ANTLR-generated lexer and parser to convert ESPACE syntax into structured models.
 */
export class ExperimentParser {
  /**
   * Parses an ESPACE experiment file into an ExperimentModel.
   *
   * @param espaceFileName - Path to the ESPACE experiment file
   * @returns Promise resolving to the parsed experiment model
   * @throws Error if the file cannot be read or contains syntax errors
   */
  async parse(espaceFileName: string): Promise<ExperimentModel> {
    const content = await fs.promises.readFile(espaceFileName, 'utf-8');
    const input = antlr.CharStream.fromString(content);
    const lexer = new ESPACELexer(input);
    const tokens = new antlr.CommonTokenStream(lexer);
    const parser = new ESPACEParser(tokens);

    // Remove default error listeners and add our custom one
    parser.removeErrorListeners();
    lexer.removeErrorListeners();

    const errorListener = new ParsingErrorListener(espaceFileName);
    parser.addErrorListener(errorListener);
    lexer.addErrorListener(errorListener);

    const tree = parser.program();
    const visitor = new ExperimentModelVisitor();

    return visitor.visit(tree) as ExperimentModel;
  }
}
