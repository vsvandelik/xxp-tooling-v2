import { AbstractParseTreeVisitor, ParserRuleContext } from 'antlr4ng';
import { ScopedSymbol } from 'antlr4-c3';
import { DocumentManager } from '../../../core/managers/DocumentsManager.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { Document } from '../../../core/documents/Document.js';
import { ESPACEVisitor } from '@extremexp/core';

export class XxpSpaceSymbolTableBuilder
  extends AbstractParseTreeVisitor<DocumentSymbolTable>
  implements ESPACEVisitor<DocumentSymbolTable>
{
  protected currentScope: ScopedSymbol;

  constructor(
    protected documentsManager: DocumentManager,
    protected document: Document,
    public readonly symbolTable: DocumentSymbolTable
  ) {
    super();
    this.currentScope = this.symbolTable;
  }

  protected override defaultResult(): DocumentSymbolTable {
    return this.symbolTable;
  }
}
