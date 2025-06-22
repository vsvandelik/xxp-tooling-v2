import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { DocumentSymbolParams, DocumentSymbol, SymbolKind, Range } from 'vscode-languageserver';
import { WorkflowSymbol } from '../core/symbols/WorkflowSymbol.js';
import { TaskSymbol } from '../core/symbols/TaskSymbol.js';
import { DataSymbol } from '../core/symbols/DataSymbol.js';
import { ExperimentSymbol } from '../core/symbols/ExperimentSymbol.js';
import { SpaceSymbol } from '../core/symbols/SpaceSymbol.js';
import { RangeUtils } from '../utils/RangeUtils.js';
import { BaseSymbol, ScopedSymbol } from 'antlr4-c3';

export class DocumentSymbolProvider extends Provider {
  private logger = Logger.getInstance();

  public addHandlers(): void {
    this.connection?.onDocumentSymbol(params => this.onDocumentSymbol(params));
  }

  private async onDocumentSymbol(params: DocumentSymbolParams): Promise<DocumentSymbol[] | null> {
    this.logger.info(`Received document symbol request for document: ${params.textDocument.uri}`);

    const document = this.documentManager?.getDocument(params.textDocument.uri);
    if (!document || !document.symbolTable) return null;

    const symbols: DocumentSymbol[] = [];

    // Process all top-level symbols
    for (const symbol of document.symbolTable.children) {
      const documentSymbol = this.convertToDocumentSymbol(symbol);
      if (documentSymbol) {
        symbols.push(documentSymbol);
      }
    }

    return symbols;
  }

  private convertToDocumentSymbol(symbol: BaseSymbol): DocumentSymbol | null {
    let kind: SymbolKind;
    let detail = '';

    if (symbol instanceof WorkflowSymbol) {
      kind = SymbolKind.Class;
      detail = symbol.parentWorkflow ? `extends ${symbol.parentWorkflow.name}` : 'workflow';
    } else if (symbol instanceof ExperimentSymbol) {
      kind = SymbolKind.Class;
      detail = 'experiment';
    } else if (symbol instanceof TaskSymbol) {
      kind = SymbolKind.Function;
      detail = symbol.implementation ? `impl: ${symbol.implementation}` : 'task';
    } else if (symbol instanceof DataSymbol) {
      kind = SymbolKind.Variable;
      detail = symbol.value ? `= "${symbol.value}"` : 'data';
    } else if (symbol instanceof SpaceSymbol) {
      kind = SymbolKind.Module;
      detail = `of ${symbol.workflowName}`;
    } else {
      kind = SymbolKind.Object;
    }

    const range = this.getSymbolRange(symbol);
    if (!range) return null;

    const documentSymbol: DocumentSymbol = {
      name: symbol.name,
      detail,
      kind,
      range,
      selectionRange: range,
      children: [],
    };

    // Process children if it's a scoped symbol
    if (symbol instanceof ScopedSymbol) {
      for (const child of symbol.children) {
        const childSymbol = this.convertToDocumentSymbol(child);
        if (childSymbol) {
          documentSymbol.children?.push(childSymbol);
        }
      }
    }

    return documentSymbol;
  }

  private getSymbolRange(symbol: BaseSymbol): Range | null {
    if ('context' in symbol && symbol.context) {
      return RangeUtils.getRangeFromParseTree(symbol.context) || null;
    }
    return null;
  }
}
