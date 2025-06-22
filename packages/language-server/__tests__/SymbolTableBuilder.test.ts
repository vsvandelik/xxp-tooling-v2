import { XxpSymbolTableBuilder } from '../src/core/symbols/builders/XxpSymbolTableBuilder.js';
import { DocumentManager } from '../src/core/managers/DocumentManager.js';
import { Document } from '../src/core/documents/Document.js';
import { DocumentSymbolTable } from '../src/core/symbols/DocumentSymbolTable.js';
import { CharStream, CommonTokenStream } from 'antlr4ng';
import { XXPLexer, XXPParser } from '@extremexp/core';
import { TextDocument } from 'vscode-languageserver-textdocument';

// Mock Document class for testing
class MockDocument extends Document {
  constructor(uri: string) {
    super(uri);
  }  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected parse(_textDocument: TextDocument): void {
    // Mock implementation - not needed for this test
  }
}

describe('Symbol Table Builder - Duplicate Symbol Fix', () => {
  let documentManager: DocumentManager;
  let document: Document;
  let folderSymbolTable: DocumentSymbolTable;

  beforeEach(() => {
    documentManager = new DocumentManager();
    document = new MockDocument('file:///test/testworkflow.xxp');
    folderSymbolTable = new DocumentSymbolTable('test-folder');
  });

  it('should not report duplicate symbols when building symbol table multiple times', () => {
    const workflowContent = `workflow TestWorkflow {
    define data inputData;
    define data outputData;
    define task processing;
    
    configure task processing {
        input inputData;
        output outputData;
    }
}`;

    // Parse the content
    const inputStream = CharStream.fromString(workflowContent);
    const lexer = new XXPLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new XXPParser(tokenStream);
    const parseTree = parser.program();

    // Build symbol table first time
    document.diagnostics = [];
    const builder1 = new XxpSymbolTableBuilder(documentManager, document, folderSymbolTable);
    builder1.visit(parseTree);

    // Check that there are no duplicate symbol errors
    const firstBuildErrors = document.diagnostics.filter(d => 
      d.message.includes('Duplicate symbol')
    );
    expect(firstBuildErrors).toHaveLength(0);

    // Build symbol table again (simulating reparse)
    document.diagnostics = [];
    const builder2 = new XxpSymbolTableBuilder(documentManager, document, folderSymbolTable);
    builder2.visit(parseTree);

    // Check that there are still no duplicate symbol errors
    const secondBuildErrors = document.diagnostics.filter(d => 
      d.message.includes('Duplicate symbol')
    );
    expect(secondBuildErrors).toHaveLength(0);
  });
});
