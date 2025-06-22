import { Document } from './Document';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentParser } from '../parsing/DocumentParser.js';

export class XxpDocument extends Document {
    constructor(uri: string, private parser: DocumentParser) {
        super(uri);
    }

    protected parse(textDocument: TextDocument): void {
        this.parser.parseXxpDocument(textDocument, this);
    }
}