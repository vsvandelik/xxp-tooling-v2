import { ParseTree, TokenStream } from 'antlr4ng';
import { TokenPosition } from '../core/models/TokenPosition.js';
import { CaretPosition } from '../core/models/CaretPosition.js';
import { Position } from 'vscode-languageserver-textdocument';
export declare abstract class PositionUtils {
    static getCurrentPosition(parseTree: ParseTree, tokens: TokenStream, position: Position): TokenPosition | undefined;
    static getCurrentPositionFromCaretPosition(parseTree: ParseTree, tokens: TokenStream, caretPosition: CaretPosition): TokenPosition | undefined;
    private static getNearestTokenIndex;
    private static findTerminalNodeOrParentRule;
}
//# sourceMappingURL=PositionUtils.d.ts.map