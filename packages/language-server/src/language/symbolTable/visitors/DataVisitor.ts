import { DataSymbol } from '../../../core/models/symbols/DataSymbol.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addSymbolOfTypeWithInheritanceCheck } from '../helpers/SymbolHelpers.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import { DataDefinitionContext } from '@extremexp/core/src/language/generated/XXPParser.js';

export class DataVisitor {
  constructor(private readonly builder: XxpSymbolTableBuilder) {}

  public visitDefinition(ctx: DataDefinitionContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const dataName = identifier.getText();
    if (!dataName) return this.builder.defaultResult();

    addSymbolOfTypeWithInheritanceCheck(
      this.builder,
      DataSymbol,
      dataName,
      ctx,
      'data',
      this.builder.currentScope,
      this.builder.document
    );

    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }
}
