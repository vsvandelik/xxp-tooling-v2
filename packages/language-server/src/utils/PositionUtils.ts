import { ParseTree, TokenStream, ParserRuleContext, TerminalNode, Token } from 'antlr4ng';
import { Position } from 'vscode-languageserver-textdocument';

import { CaretPosition } from '../core/models/CaretPosition.js';
import { TokenPosition } from '../core/models/TokenPosition.js';

export abstract class PositionUtils {
  public static getCurrentPosition(
    parseTree: ParseTree,
    tokens: TokenStream,
    position: Position
  ): TokenPosition | undefined {
    const caretPosition: CaretPosition = { line: position.line + 1, column: position.character };
    return this.getCurrentPositionFromCaretPosition(parseTree, tokens, caretPosition);
  }

  public static getCurrentPositionFromCaretPosition(
    parseTree: ParseTree,
    tokens: TokenStream,
    caretPosition: CaretPosition
  ): TokenPosition | undefined {
    const { index, token } = this.getNearestTokenIndex(tokens, caretPosition);
    const terminalNodeOrParentRule = this.findTerminalNodeOrParentRule(
      parseTree as ParserRuleContext,
      index
    );

    let terminalNode: TerminalNode | undefined = undefined;
    let parserRule: ParserRuleContext;

    if (terminalNodeOrParentRule instanceof TerminalNode) {
      terminalNode = terminalNodeOrParentRule;
      parserRule = terminalNode.parent as ParserRuleContext;
    } else {
      parserRule = terminalNodeOrParentRule as ParserRuleContext;
    }

    if (token && parserRule) {
      const text = token.text || '';
      return {
        index,
        parseTree: parserRule,
        text: text.trim(),
        terminalNode: terminalNode,
      };
    }

    return undefined;
  }

  private static getNearestTokenIndex(
    tokens: TokenStream,
    caretPosition: CaretPosition
  ): { index: number; token: Token } {
    let index: number = 0;
    let token: Token = tokens.get(index);

    for (index = 0; ; ++index) {
      token = tokens.get(index);
      if (
        token.type === Token.EOF ||
        token.line > caretPosition.line ||
        index === tokens.size - 1
      ) {
        break;
      }
      if (token.line < caretPosition.line) {
        continue;
      }
      const length = token.text ? token.text.length : 0;
      if (token.column + length >= caretPosition.column) {
        break;
      }
    }

    return { index, token };
  }

  private static findTerminalNodeOrParentRule(
    parseTree: ParserRuleContext,
    tokenIndex: number
  ): TerminalNode | ParserRuleContext {
    for (const child of parseTree.children) {
      if (child instanceof TerminalNode && child.symbol.tokenIndex === tokenIndex) {
        return child; // Found terminal node
      } else if (
        child instanceof ParserRuleContext &&
        child.start &&
        child.stop &&
        child.start.tokenIndex <= tokenIndex &&
        child.stop.tokenIndex >= tokenIndex
      ) {
        return this.findTerminalNodeOrParentRule(child, tokenIndex);
      }
    }

    return parseTree; // Found parent rule
  }
}
