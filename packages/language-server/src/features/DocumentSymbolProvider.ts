import { DocumentSymbolParams, DocumentSymbol } from 'vscode-languageserver/node';
import { DocumentManager } from '../documents/DocumentManager.js';

export class DocumentSymbolProvider {
  constructor(private documentManager: DocumentManager) {}

  async provideDocumentSymbols(params: DocumentSymbolParams): Promise<DocumentSymbol[] | null> {
    const document = this.documentManager.getDocument(params.textDocument.uri);
    if (!document) return null;

    // Return the pre-computed symbols from the parsed document
    return document.symbols;
  }
}