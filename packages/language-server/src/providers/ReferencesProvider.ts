import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { ReferenceParams, Location, DefinitionParams } from 'vscode-languageserver';
import { RangeUtils } from '../utils/RangeUtils.js';

export class ReferencesProvider extends Provider {
  private logger = Logger.getInstance();

  public addHandlers(): void {
    this.connection?.onReferences(params => this.onReferences(params));
    this.connection?.onDefinition(params => this.onDefinition(params));
  }

  private async onReferences(params: ReferenceParams): Promise<Location[] | null> {
    this.logger.info(`Received references request for document: ${params.textDocument.uri}`);

    const result = this.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return null;
    const [document, tokenPosition] = result;

    const symbol = await this.findSymbolAtPosition(document, tokenPosition.text);
    if (!symbol) return null;

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
    if (params.context.includeDeclaration && symbol.context) {
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

  private async onDefinition(params: DefinitionParams): Promise<Location | null> {
    this.logger.info(`Received definition request for document: ${params.textDocument.uri}`);

    const result = this.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return null;
    const [document, tokenPosition] = result;

    const symbol = await this.findSymbolAtPosition(document, tokenPosition.text);
    if (!symbol || !symbol.context) return null;

    const range = RangeUtils.getRangeFromParseTree(symbol.context);
    if (!range) return null;

    return {
      uri: symbol.document.uri,
      range,
    };
  }

  private async findSymbolAtPosition(document: any, text: string): Promise<any> {
    if (!document.symbolTable) return undefined;

    const allSymbols = await document.symbolTable.getAllNestedSymbols();
    return allSymbols.find((symbol: any) => symbol.name === text);
  }
}
