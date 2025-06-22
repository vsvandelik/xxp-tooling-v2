/*import { BaseSymbol } from 'antlr4-c3';
import { ReadNameContext } from '../types';
import { DataSymbol } from '../../../core/models/symbols/DataSymbol';
import { TaskSymbol } from '../../../core/models/symbols/TaskSymbol';
import { TerminalSymbolWithReferences } from '../../../core/models/symbols/TerminalSymbolWithReferences';
import { DocumentSymbolTable } from '../DocumentSymbolTable';
import { addDiagnosticAndContinue } from '../helpers/Diagnostics';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder';
import { WorkflowSymbol } from '../../../core/models/symbols/WorkflowSymbol';

export class VariableReadVisitor {
	constructor(private readonly builder: XxpSymbolTableBuilder) { }

	public visitWorkflow(ctx: ReadNameContext): DocumentSymbolTable {
		if (ctx.IDENTIFIER() === null) return this.builder.visitChildren(ctx) as DocumentSymbolTable;
		return this.visitSymbolRead(WorkflowSymbol, ctx, 'Workflow');
	}

	public visitData(ctx: ReadNameContext): DocumentSymbolTable {
		if (ctx.IDENTIFIER() === null) return this.builder.visitChildren(ctx) as DocumentSymbolTable;
		return this.visitSymbolRead(DataSymbol, ctx, 'Data variable');
	}

	public visitTask(ctx: ReadNameContext): DocumentSymbolTable {
		if (ctx.IDENTIFIER() === null) return this.builder.visitChildren(ctx) as DocumentSymbolTable;
		return this.visitSymbolRead(TaskSymbol, ctx, 'Task variable');
	}

	private visitSymbolRead<T extends BaseSymbol>(
		type: new (...args: any[]) => T,
		ctx: ReadNameContext,
		prefix: string
	): DocumentSymbolTable {
		const identifierText = ctx.IDENTIFIER().getText();
		const symbols = this.builder.currentScope.getNestedSymbolsOfTypeSync(type).filter(
			symbol => symbol.name === identifierText
		);

		if (symbols.length === 0) {
			return addDiagnosticAndContinue(
				this.builder,
				ctx,
				`${prefix} '${identifierText}' is not defined`
			);
		}

		if (symbols.length > 1) {
			return addDiagnosticAndContinue(
				this.builder,
				ctx,
				`${prefix} '${identifierText}' is defined multiple times`
			);
		}

		const matchedSymbol = symbols[0];
		if (matchedSymbol instanceof TerminalSymbolWithReferences) {
			matchedSymbol.addReference(ctx.IDENTIFIER(), this.builder.document);
		} else if (matchedSymbol instanceof WorkflowSymbol) {
			matchedSymbol.addReference(ctx.IDENTIFIER(), this.builder.document);
		}

		return this.builder.visitChildren(ctx) as DocumentSymbolTable;
	}
}*/

import { XxpSymbolTableBuilder } from "../builders/XxpSymbolTableBuilder";

export class VariableReadVisitor {
	constructor(private readonly builder: XxpSymbolTableBuilder) {}
}