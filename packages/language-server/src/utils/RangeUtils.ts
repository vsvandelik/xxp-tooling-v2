import { ParseTree, ParserRuleContext, TerminalNode } from 'antlr4ng';
import { Range } from 'vscode-languageserver';

export abstract class RangeUtils {
  public static getRangeFromParseTree(rule: ParseTree): Range | undefined {
    if (rule instanceof ParserRuleContext && rule.start && rule.stop) {
      return Range.create(
        rule.start.line - 1,
        rule.start.column,
        rule.stop.line - 1,
        rule.stop.column + rule.getText().length
      );
    } else if (rule instanceof TerminalNode) {
      return Range.create(
        rule.symbol.line - 1,
        rule.symbol.column,
        rule.symbol.line - 1,
        rule.symbol.column + rule.getText().length
      );
    }

    return undefined;
  }
}
