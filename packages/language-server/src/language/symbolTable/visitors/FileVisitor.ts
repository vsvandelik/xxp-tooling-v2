import { addDiagnostic } from '../helpers/Diagnostics.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import { FileUtils } from '../../../utils/FileUtils.js';
import { FileNameStringContext } from '@extremexp/core/src/language/generated/XXPParser.js';

export class FileVisitor {
  constructor(private readonly builder: XxpSymbolTableBuilder) {}

  public visitFileName(ctx: FileNameStringContext): DocumentSymbolTable {
    const stringNode = ctx.STRING();
    if (!stringNode) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    try {
      FileUtils.validateFilePath(stringNode.getText());
    } catch (error) {
      if (error instanceof Error) {
        addDiagnostic(this.builder, ctx, error.message);
      }
    }

    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }
}
