/*import { addDiagnostic } from '../helpers/Diagnostics';
import { DocumentSymbolTable } from '../DocumentSymbolTable';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder';
import { FileUtils } from '../../../utils/FileUtils';

export class FileVisitor {
	constructor(private readonly builder: XxpSymbolTableBuilder) { }

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
}*/

import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';

export class FileVisitor {
  constructor(private readonly builder: XxpSymbolTableBuilder) {}
}
