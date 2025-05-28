import { ExperimentModel } from "../models/ExperimentModel.js";
import { ESPACEParser, ESPACELexer } from "@extremexp/core";
import * as fs from 'fs';
import * as antlr from 'antlr4ng';
import { ExperimentModelVisitor } from "../visitors/ExperimentModelVisitor.js";

export class ExperimentParser {
    async parse(espaceFileName: string): Promise<ExperimentModel> {
        const content = await fs.promises.readFile(espaceFileName, 'utf-8');
        const input = antlr.CharStream.fromString(content);
        const lexer = new ESPACELexer(input);
        const tokens = new antlr.CommonTokenStream(lexer);
        const parser = new ESPACEParser(tokens);

        const tree = parser.program();
        const visitor = new ExperimentModelVisitor();
        
        return visitor.visit(tree) as ExperimentModel;
    }

}