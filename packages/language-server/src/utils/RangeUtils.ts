// utils/RangeUtils.ts
import { ParseTree, ParserRuleContext, TerminalNode } from 'antlr4ng';
import { Range } from 'vscode-languageserver';

export class RangeUtils {
    /**
     * Creates a Range from a ParseTree node
     * @param rule The ParseTree node (ParserRuleContext or TerminalNode)
     * @returns Range object or undefined if position information is not available
     */
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

    /**
     * Creates a Range from start and end positions
     * @param startLine Start line (0-based)
     * @param startChar Start character (0-based)
     * @param endLine End line (0-based)
     * @param endChar End character (0-based)
     * @returns Range object
     */
    public static createRange(startLine: number, startChar: number, endLine: number, endChar: number): Range {
        return Range.create(startLine, startChar, endLine, endChar);
    }

    /**
     * Creates a Range that spans the entire line
     * @param line Line number (0-based)
     * @returns Range object covering the entire line
     */
    public static createLineRange(line: number): Range {
        return Range.create(line, 0, line, Number.MAX_SAFE_INTEGER);
    }

    /**
     * Creates a Range from a token with a specific length
     * @param line Line number (1-based from ANTLR, will be converted to 0-based)
     * @param column Column number (0-based)
     * @param length Length of the token
     * @returns Range object
     */
    public static createTokenRange(line: number, column: number, length: number): Range {
        return Range.create(
            line - 1,  // Convert from 1-based to 0-based
            column,
            line - 1,
            column + length
        );
    }

    /**
     * Checks if a position is within a range
     * @param range The range to check
     * @param line Line number (0-based)
     * @param character Character position (0-based)
     * @returns True if position is within range
     */
    public static containsPosition(range: Range, line: number, character: number): boolean {
        if (line < range.start.line || line > range.end.line) {
            return false;
        }
        
        if (line === range.start.line && character < range.start.character) {
            return false;
        }
        
        if (line === range.end.line && character > range.end.character) {
            return false;
        }
        
        return true;
    }

    /**
     * Checks if two ranges overlap
     * @param range1 First range
     * @param range2 Second range
     * @returns True if ranges overlap
     */
    public static rangesOverlap(range1: Range, range2: Range): boolean {
        return !(range1.end.line < range2.start.line || 
                 range2.end.line < range1.start.line ||
                 (range1.end.line === range2.start.line && range1.end.character < range2.start.character) ||
                 (range2.end.line === range1.start.line && range2.end.character < range1.start.character));
    }

    /**
     * Merges two ranges into one that encompasses both
     * @param range1 First range
     * @param range2 Second range
     * @returns Merged range
     */
    public static mergeRanges(range1: Range, range2: Range): Range {
        const startLine = Math.min(range1.start.line, range2.start.line);
        const startChar = range1.start.line === range2.start.line 
            ? Math.min(range1.start.character, range2.start.character)
            : (range1.start.line < range2.start.line ? range1.start.character : range2.start.character);
            
        const endLine = Math.max(range1.end.line, range2.end.line);
        const endChar = range1.end.line === range2.end.line 
            ? Math.max(range1.end.character, range2.end.character)
            : (range1.end.line > range2.end.line ? range1.end.character : range2.end.character);
            
        return Range.create(startLine, startChar, endLine, endChar);
    }

    /**
     * Gets the text length covered by a range on a single line
     * @param range The range (must be on a single line)
     * @returns Length of the range
     */
    public static getRangeLength(range: Range): number {
        if (range.start.line !== range.end.line) {
            throw new Error('Range spans multiple lines');
        }
        return range.end.character - range.start.character;
    }

    /**
     * Adjusts a range by a given offset
     * @param range Original range
     * @param lineOffset Lines to add/subtract
     * @param charOffset Characters to add/subtract (only applied to start line)
     * @returns Adjusted range
     */
    public static offsetRange(range: Range, lineOffset: number, charOffset: number = 0): Range {
        return Range.create(
            range.start.line + lineOffset,
            range.start.character + (lineOffset === 0 ? charOffset : 0),
            range.end.line + lineOffset,
            range.end.character + (lineOffset === 0 && range.start.line === range.end.line ? charOffset : 0)
        );
    }

    /**
     * Creates a zero-width range at a specific position
     * @param line Line number (0-based)
     * @param character Character position (0-based)
     * @returns Zero-width range
     */
    public static createPositionRange(line: number, character: number): Range {
        return Range.create(line, character, line, character);
    }
}