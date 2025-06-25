import { ParseTree, ParserRuleContext, TerminalNode } from 'antlr4ng';
import { Range } from 'vscode-languageserver';

export abstract class RangeUtils {
  public static getRangeFromParseTree(rule: ParseTree): Range | undefined {
    if (rule instanceof ParserRuleContext && rule.start && rule.stop) {
      const text = rule.getText();
      // Calculate end position based on text length for more accurate ranges
      const endColumn = rule.start.column + text.length;
      const range = Range.create(
        rule.start.line - 1,
        rule.start.column,
        rule.stop.line - 1,
        endColumn
      );
      return range;
    } else if (rule instanceof TerminalNode && rule.symbol) {
      const text = rule.getText();
      const range = Range.create(
        rule.symbol.line - 1,
        rule.symbol.column,
        rule.symbol.line - 1,
        rule.symbol.column + text.length
      );
      return range;
    }

    return undefined;
  }
}
