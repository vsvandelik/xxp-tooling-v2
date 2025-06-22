import { ParseTree, ParserRuleContext, TerminalNode } from 'antlr4ng';

export interface CaretPosition {
    line: number;
    column: number;
}

export interface TokenPosition {
    index: number;
    parseTree: ParserRuleContext;
    terminalNode?: TerminalNode;
    text: string;
}