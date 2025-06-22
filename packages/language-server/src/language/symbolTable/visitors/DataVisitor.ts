/*import { DiagnosticSeverity } from 'vscode-languageserver';
import { DataDeclarationScopeSymbol } from '../../../core/models/symbols/DataDeclarationScopeSymbol';
import { DataSymbol } from '../../../core/models/symbols/DataSymbol';
import { FileUtils } from '../../../utils/FileUtils';
import { StringUtils } from '../../../utils/StringUtils';
import { DocumentSymbolTable } from '../DocumentSymbolTable';
import { addDiagnostic } from '../helpers/Diagnostics';
import { addSymbolOfTypeWithContext, visitScopeSymbol } from '../helpers/SymbolHelpers';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder';
import { DataDefinitionContext } from '@extremexp/core';

export class DataVisitor {
	constructor(private readonly builder: XxpSymbolTableBuilder) { }

	public visitDefinition(ctx: DataDefinitionContext): DocumentSymbolTable {
		const identifier = ctx.IDENTIFIER();
		if (!identifier) {
			return this.builder.visitChildren(ctx) as DocumentSymbolTable;
		}

		const dataName = identifier.getText();
		const dataSymbol = addSymbolOfTypeWithContext(
			this.builder,
			DataSymbol,
			dataName,
			ctx,
			this.builder.currentScope,
			this.builder.document,
		);
		if (!dataName) return this.builder.defaultResult();

		if (ctx.dataDefinitionBody() && dataSymbol) {
			return visitScopeSymbol(
				this.builder,
				DataDeclarationScopeSymbol,
				ctx.dataDefinitionBody()!,
				dataSymbol
			);
		}

		return this.builder.visitChildren(ctx) as DocumentSymbolTable;
	}

	public visitSchema(ctx: SchemaDefinitionContext): DocumentSymbolTable {
		const dataSymbol = this.getDataSymbolFromCurrentScope();
		if (!dataSymbol || !ctx.fileNameString()) {
			return this.builder.visitChildren(ctx) as DocumentSymbolTable;
		}

		const schemaPath = ctx.fileNameString().getText();
		dataSymbol.schemaFilePath = schemaPath;

		try {
			const cleanPath = StringUtils.removeDoubleQuotes(schemaPath);
			FileUtils.getFileInformation(cleanPath);
		} catch (error) {
			if (error instanceof Error) {
				addDiagnostic(this.builder, ctx, `Schema file error: ${error.message}`,
					DiagnosticSeverity.Warning
				);
			}
		}

		return this.builder.visitChildren(ctx) as DocumentSymbolTable;
	}

	private getDataSymbolFromCurrentScope(): DataSymbol | undefined {
		if (
			!(this.builder.currentScope instanceof DataDeclarationScopeSymbol) ||
			!this.builder.currentScope.symbolReference
		) {
			return undefined;
		}
		return this.builder.currentScope.symbolReference as DataSymbol;
	}

}*/

import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';

export class DataVisitor {
  constructor(private readonly builder: XxpSymbolTableBuilder) {}
}
