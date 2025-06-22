import { ExperimentSymbol } from '../../../core/models/symbols/ExperimentSymbol.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addSymbolOfTypeWithContext } from '../helpers/SymbolHelpers.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import { EspaceExperimentHeaderContext, EspaceExperimentBodyContext } from '@extremexp/core';

export class EspaceExperimentVisitor {
  constructor(private readonly builder: EspaceSymbolTableBuilder) {}

  public visitHeader(ctx: EspaceExperimentHeaderContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const experimentName = identifier.getText();
    const experimentSymbol =
      this.getExistingExperimentSymbolTable(experimentName) ||
      addSymbolOfTypeWithContext(
        this.builder,
        ExperimentSymbol,
        experimentName,
        ctx.parent!,
        this.builder.currentScope,
        this.builder.document
      );

    if (!experimentSymbol) {
      return this.builder.defaultResult();
    }

    this.builder.currentScope = experimentSymbol;
    return this.builder.defaultResult();
  }

  public visitBody(ctx: EspaceExperimentBodyContext): DocumentSymbolTable {
    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }

  private getExistingExperimentSymbolTable(experimentName: string): ExperimentSymbol | undefined {
    if (!(this.builder.currentScope instanceof DocumentSymbolTable)) {
      throw new Error('Current scope is not a DocumentSymbolTable');
    }

    const existingExperimentSymbolRaw = this.builder.symbolTable.children.find(
      c => c instanceof ExperimentSymbol && c.name === experimentName
    );
    if (!existingExperimentSymbolRaw) return;

    const existingExperimentSymbol = existingExperimentSymbolRaw as ExperimentSymbol;
    if (existingExperimentSymbol.document.uri === this.builder.document.uri) {
      existingExperimentSymbol.clear();
      return existingExperimentSymbol;
    }

    return undefined;
  }
}
