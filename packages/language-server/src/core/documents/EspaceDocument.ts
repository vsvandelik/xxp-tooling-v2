import { Document } from './Document.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentParser } from '../parsing/DocumentParser.js';

export class EspaceDocument extends Document {
  constructor(
    uri: string,
    private documentParser: DocumentParser
  ) {
    super(uri);
  }

  protected parse(textDocument: TextDocument): void {
    this.documentParser.parseEspaceDocument(textDocument, this);
  }
}
