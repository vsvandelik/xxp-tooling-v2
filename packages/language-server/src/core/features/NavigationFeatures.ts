import { Document } from '../documents/Document.js';
import { TokenPosition } from '../types/Position.js';
import { Location, Range } from 'vscode-languageserver';
import { RangeUtils } from '../../utils/RangeUtils.js';
import { Logger } from '../../utils/Logger.js';

export class NavigationFeatures {
  private logger = Logger.getInstance();

  public async findDefinition(
    document: Document,
    position: TokenPosition
  ): Promise<Location | null> {
    if (!document.symbolTable) return null;

    const symbol = await this.findSymbolAtPosition(document, position.text);
    if (!symbol || !symbol.context) return null;

    const range = RangeUtils.getRangeFromParseTree(symbol.context);
    if (!range) return null;

    return {
      uri: symbol.document.uri,
      range,
    };
  }

  public async findReferences(
    document: Document,
    position: TokenPosition,
    includeDeclaration: boolean = false
  ): Promise<Location[]> {
    if (!document.symbolTable) return [];

    const symbol = await this.findSymbolAtPosition(document, position.text);
    if (!symbol) return [];

    const locations: Location[] = [];

    // Add references
    if (symbol.references) {
      for (const reference of symbol.references) {
        const range = RangeUtils.getRangeFromParseTree(reference.node);
        if (range) {
          locations.push({
            uri: reference.document.uri,
            range,
          });
        }
      }
    }

    // Add declaration if requested
    if (includeDeclaration && symbol.context) {
      const definitionRange = RangeUtils.getRangeFromParseTree(symbol.context);
      if (definitionRange) {
        locations.push({
          uri: symbol.document.uri,
          range: definitionRange,
        });
      }
    }

    return locations;
  }

  public async findImplementations(
    document: Document,
    position: TokenPosition
  ): Promise<Location[]> {
    // This could be extended to find implementations of abstract workflows or tasks
    return [];
  }

  private async findSymbolAtPosition(document: Document, text: string): Promise<any> {
    if (!document.symbolTable) return undefined;

    const allSymbols = await document.symbolTable.getAllNestedSymbols();
    return allSymbols.find((symbol: any) => symbol.name === text);
  }
}
