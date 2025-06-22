import { DataSymbol } from '../../../core/models/symbols/DataSymbol.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addSymbolOfTypeWithContext } from '../helpers/SymbolHelpers.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import { DataDefinitionContext } from '@extremexp/core';

export class DataVisitor {
  constructor(private readonly builder: XxpSymbolTableBuilder) {}

  public visitDefinition(ctx: DataDefinitionContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const dataName = identifier.getText();
    if (!dataName) return this.builder.defaultResult();

    addSymbolOfTypeWithContext(
      this.builder,
      DataSymbol,
      dataName,
      ctx,
      this.builder.currentScope,
      this.builder.document
    );

    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }
}
