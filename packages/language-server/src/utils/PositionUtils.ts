import { Position, Range } from 'vscode-languageserver/node';

export class PositionUtils {
  static isPositionInRange(position: Position, range: Range): boolean {
    if (position.line < range.start.line || position.line > range.end.line) {
      return false;
    }

    if (position.line === range.start.line && position.character < range.start.character) {
      return false;
    }

    if (position.line === range.end.line && position.character > range.end.character) {
      return false;
    }

    return true;
  }

  static comparePositions(a: Position, b: Position): number {
    if (a.line !== b.line) {
      return a.line - b.line;
    }
    return a.character - b.character;
  }

  static rangeContains(outer: Range, inner: Range): boolean {
    return (
      this.comparePositions(outer.start, inner.start) <= 0 &&
      this.comparePositions(outer.end, inner.end) >= 0
    );
  }

  static rangesOverlap(a: Range, b: Range): boolean {
    return !(
      this.comparePositions(a.end, b.start) < 0 || this.comparePositions(b.end, a.start) < 0
    );
  }

  static offsetToPosition(text: string, offset: number): Position {
    let line = 0;
    let character = 0;

    for (let i = 0; i < offset && i < text.length; i++) {
      if (text[i] === '\n') {
        line++;
        character = 0;
      } else {
        character++;
      }
    }

    return { line, character };
  }

  static positionToOffset(text: string, position: Position): number {
    const lines = text.split('\n');
    let offset = 0;
    for (let i = 0; i < position.line && i < lines.length; i++) {
      offset += (lines[i]?.length || 0) + 1; // +1 for newline
    }

    offset += position.character;
    return offset;
  }
}
