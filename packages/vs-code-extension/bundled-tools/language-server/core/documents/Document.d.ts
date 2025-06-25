import { CommonTokenStream, Lexer, Parser, ParseTree } from 'antlr4ng';
import { Diagnostic } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentParser } from '../../language/parsing/DocumentParser.js';
import { DocumentSymbolTable } from '../../language/symbolTable/DocumentSymbolTable.js';
import { WorkflowSymbol } from '../models/symbols/WorkflowSymbol.js';
import { CodeCompletionCore } from 'antlr4-c3';
export declare abstract class Document {
    readonly uri: string;
    private readonly documentParser;
    private logger;
    documentsThisDependsOn: Set<Document>;
    documentsDependingOnThis: Set<Document>;
    symbolTable?: DocumentSymbolTable;
    workflowSymbolTable?: WorkflowSymbol;
    diagnostics?: Diagnostic[];
    documentVersion: number;
    lexer?: Lexer;
    parser?: Parser;
    rootParseTree?: ParseTree;
    tokenStream?: CommonTokenStream;
    codeCompletionCore?: CodeCompletionCore;
    forcedFsParsing?: boolean;
    constructor(uri: string, documentParser: DocumentParser);
    updateDocument(textDocument: TextDocument): void;
    static addDocumentDependency(thisDependsOn: Document, dependingOnThis: Document): void;
}
//# sourceMappingURL=Document.d.ts.map