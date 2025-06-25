import { ParserRuleContext, TerminalNode, Token } from 'antlr4ng';
export class PositionUtils {
    static getCurrentPosition(parseTree, tokens, position) {
        const caretPosition = { line: position.line + 1, column: position.character };
        return this.getCurrentPositionFromCaretPosition(parseTree, tokens, caretPosition);
    }
    static getCurrentPositionFromCaretPosition(parseTree, tokens, caretPosition) {
        const { index, token } = this.getNearestTokenIndex(tokens, caretPosition);
        const terminalNodeOrParentRule = this.findTerminalNodeOrParentRule(parseTree, index);
        let terminalNode = undefined;
        let parserRule;
        if (terminalNodeOrParentRule instanceof TerminalNode) {
            terminalNode = terminalNodeOrParentRule;
            parserRule = terminalNode.parent;
        }
        else {
            parserRule = terminalNodeOrParentRule;
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
    static getNearestTokenIndex(tokens, caretPosition) {
        let index = 0;
        let token = tokens.get(index);
        for (index = 0;; ++index) {
            token = tokens.get(index);
            if (token.type === Token.EOF ||
                token.line > caretPosition.line ||
                index === tokens.size - 1) {
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
    static findTerminalNodeOrParentRule(parseTree, tokenIndex) {
        for (const child of parseTree.children) {
            if (child instanceof TerminalNode && child.symbol.tokenIndex === tokenIndex) {
                return child;
            }
            else if (child instanceof ParserRuleContext &&
                child.start &&
                child.stop &&
                child.start.tokenIndex <= tokenIndex &&
                child.stop.tokenIndex >= tokenIndex) {
                return this.findTerminalNodeOrParentRule(child, tokenIndex);
            }
        }
        return parseTree;
    }
}
//# sourceMappingURL=PositionUtils.js.map