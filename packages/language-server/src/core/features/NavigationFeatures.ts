import { Document } from '../documents/Document.js';
import { TokenPosition } from '../types/Position.js';
import { Location, Range } from 'vscode-languageserver';
import { RangeUtils } from '../../utils/RangeUtils.js';
import { Logger } from '../../utils/Logger.js';
import { BaseSymbol } from 'antlr4-c3';
import { WorkflowSymbol } from '../symbols/WorkflowSymbol.js';
import { TaskSymbol } from '../symbols/TaskSymbol.js';
import { DataSymbol } from '../symbols/DataSymbol.js';
import { SpaceSymbol } from '../symbols/SpaceSymbol.js';
import { ExperimentSymbol } from '../symbols/ExperimentSymbol.js';

// Union type for all symbol types that have document and references properties
type DocumentSymbol = DataSymbol | TaskSymbol | SpaceSymbol | WorkflowSymbol | ExperimentSymbol;

// Type guard to check if a BaseSymbol is a DocumentSymbol
function isDocumentSymbol(symbol: BaseSymbol): symbol is DocumentSymbol {
  return 'document' in symbol;
}

export class NavigationFeatures {
  private logger = Logger.getInstance();
  public async findDefinition(
    document: Document,
    position: TokenPosition
  ): Promise<Location | null> {
    if (!document.symbolTable) return null;

    const symbol = await this.findSymbolAtPosition(document, position);
    if (!symbol || !symbol.context || !isDocumentSymbol(symbol)) return null;

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

    const symbol = await this.findSymbolAtPosition(document, position);
    if (!symbol || !isDocumentSymbol(symbol)) return [];

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
    const locations: Location[] = [];

    if (!document.symbolTable) return locations;

    const symbol = await this.findSymbolAtPosition(document, position);
    if (!symbol) return locations;

    // For workflows, find all workflows that extend this one
    if (symbol instanceof WorkflowSymbol) {
      const allSymbols = await document.symbolTable.getAllNestedSymbols();

      for (const otherSymbol of allSymbols) {
        if (
          otherSymbol instanceof WorkflowSymbol &&
          otherSymbol.parentWorkflow === symbol &&
          otherSymbol.context
        ) {
          const range = RangeUtils.getRangeFromParseTree(otherSymbol.context);
          if (range) {
            locations.push({
              uri: otherSymbol.document.uri,
              range,
            });
          }
        }
      }
    }

    // For tasks, find task configurations that implement this task
    else if (symbol instanceof TaskSymbol && symbol.implementation) {
      const range = RangeUtils.createTokenRange(
        symbol.context?.start?.line || 0,
        symbol.context?.start?.column || 0,
        symbol.implementation.length
      );

      locations.push({
        uri: symbol.document.uri,
        range,
      });
    }

    return locations;
  }

  private async findSymbolAtPosition(
    document: Document,
    position: TokenPosition
  ): Promise<BaseSymbol | undefined> {
    if (!document.symbolTable) return undefined;

    const text = position.text;
    if (!text) return undefined;

    // First, try to find in the current parse tree context
    const contextSymbol = await this.findSymbolInContext(document, position);
    if (contextSymbol) return contextSymbol;

    // Then search all symbols by name
    const allSymbols = await document.symbolTable.getAllNestedSymbols();
    return this.findSymbolByName(allSymbols, text);
  }

  private async findSymbolInContext(
    document: Document,
    position: TokenPosition
  ): Promise<BaseSymbol | undefined> {
    if (!document.symbolTable) return undefined;

    // Get the current scope based on parse tree position
    const currentContext = position.parseTree;
    if (!currentContext) return undefined;

    // Find symbols valid at this position
    const validSymbols: BaseSymbol[] = [];

    // Check for different symbol types based on context
    const contextType = currentContext.constructor.name;

    if (contextType.includes('TaskNameRead')) {
      const tasks = await document.symbolTable.getValidSymbolsAtPosition(
        currentContext,
        TaskSymbol
      );
      for (const taskName of tasks) {
        const symbol = await this.findSymbolByNameAndType(
          document.symbolTable,
          taskName,
          TaskSymbol
        );
        if (symbol) validSymbols.push(symbol);
      }
    } else if (contextType.includes('DataNameRead')) {
      const dataSymbols = await document.symbolTable.getValidSymbolsAtPosition(
        currentContext,
        DataSymbol
      );
      for (const dataName of dataSymbols) {
        const symbol = await this.findSymbolByNameAndType(
          document.symbolTable,
          dataName,
          DataSymbol
        );
        if (symbol) validSymbols.push(symbol);
      }
    } else if (contextType.includes('WorkflowNameRead')) {
      // Search across all documents for workflows
      const allSymbols = await document.symbolTable.getAllNestedSymbols();
      validSymbols.push(
        ...allSymbols.filter(s => s instanceof WorkflowSymbol && s.name === position.text)
      );
    } else if (contextType.includes('SpaceNameRead')) {
      const spaces = await document.symbolTable.getValidSymbolsAtPosition(
        currentContext,
        SpaceSymbol
      );
      for (const spaceName of spaces) {
        const symbol = await this.findSymbolByNameAndType(
          document.symbolTable,
          spaceName,
          SpaceSymbol
        );
        if (symbol) validSymbols.push(symbol);
      }
    }

    // Return the first matching symbol
    return validSymbols.find(s => s.name === position.text);
  }

  private findSymbolByName(symbols: BaseSymbol[], name: string): BaseSymbol | undefined {
    return symbols.find(symbol => symbol.name === name);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async findSymbolByNameAndType<T extends BaseSymbol>(
    symbolTable: any,
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: new (...args: any[]) => T
  ): Promise<T | undefined> {
    const symbols = await symbolTable.getSymbolsOfType(type);
    return symbols.find((s: T) => s.name === name);
  }
}
