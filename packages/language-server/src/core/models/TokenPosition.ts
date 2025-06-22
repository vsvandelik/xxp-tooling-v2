import { ParseTree, TerminalNode } from 'antlr4ng';

export type TokenPosition = {
  index: number;
  parseTree: ParseTree;
  terminalNode: TerminalNode | undefined;
  text: string;
};
