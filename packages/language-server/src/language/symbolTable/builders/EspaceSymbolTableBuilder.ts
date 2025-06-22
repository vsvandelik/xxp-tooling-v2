import { AbstractParseTreeVisitor, ParserRuleContext } from 'antlr4ng';
import { ScopedSymbol } from 'antlr4-c3';
import { DocumentManager } from '../../../core/managers/DocumentsManager';
import { DocumentSymbolTable } from '../DocumentSymbolTable';
import { Document } from '../../../core/documents/Document';
import { ESPACEVisitor } from '@extremexp/core';

export class XxpSpaceSymbolTableBuilder extends AbstractParseTreeVisitor<DocumentSymbolTable> implements ESPACEVisitor<DocumentSymbolTable> {
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