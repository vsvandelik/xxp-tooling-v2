import { EspaceDataDefinitionContext } from '@extremexp/core';

import { DataSymbol } from '../../../core/models/symbols/DataSymbol.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addSymbolOfTypeWithContext } from '../helpers/SymbolHelpers.js';

export class EspaceDataVisitor {
  constructor(private readonly builder: EspaceSymbolTableBuilder) {}

  public visitDefinition(ctx: EspaceDataDefinitionContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    const schemaString = ctx.STRING();

    if (!identifier) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const dataName = identifier.getText();
    const schemaPath = schemaString ? schemaString.getText() : undefined;

    addSymbolOfTypeWithContext(
      this.builder,
      DataSymbol,
      dataName,
      ctx,
      this.builder.currentScope,
      this.builder.document,
      schemaPath
    );

    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }
}
