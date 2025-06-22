/*import { TaskConfigurationScopeSymbol } from '../../../core/models/symbols/TaskConfigurationScopeSymbol';
import { TaskSymbol } from '../../../core/models/symbols/TaskSymbol';
import { DocumentSymbolTable } from '../DocumentSymbolTable';
import { addSymbolOfTypeWithContext, visitScopeSymbol } from '../helpers/SymbolHelpers';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder';
import { ImplementationContext, ParamAssignmentContext, TaskConfigurationContext, TaskDefinitionContext } from '@extremexp/core';

export class TaskVisitor {
	constructor(private readonly builder: XxpSymbolTableBuilder) { }

	public visitDefinition(ctx: TaskDefinitionContext): DocumentSymbolTable {
		const identifier = ctx.IDENTIFIER();
		if (!identifier) {
			return this.builder.visitChildren(ctx) as DocumentSymbolTable;
		}

		const taskSymbol = addSymbolOfTypeWithContext(
			this.builder,
			TaskSymbol,
			identifier.getText(),
			ctx,
			this.builder.currentScope,
			this.builder.document,
		);
		if (!taskSymbol) return this.builder.defaultResult();

		return this.builder.visitChildren(ctx) as DocumentSymbolTable;
	}

	public visitConfiguration(ctx: TaskConfigurationContext): DocumentSymbolTable {
		const nameContext = ctx.taskConfigurationHeader()?.taskNameRead();
		if (!nameContext) {
			return this.builder.visitChildren(ctx) as DocumentSymbolTable;
		}

		const taskSymbol = this.getTaskSymbolByName(nameContext.getText());
		if (!taskSymbol) {
			return this.builder.visitChildren(ctx) as DocumentSymbolTable;
		}

		this.builder.visitChildren(ctx.taskConfigurationHeader()!);

		return visitScopeSymbol(
			this.builder,
			TaskConfigurationScopeSymbol,
			ctx.taskConfigurationBody(),
			taskSymbol
		);
	}

	public visitParam(ctx: ParamAssignmentContext): DocumentSymbolTable {
		const identifier = ctx.IDENTIFIER();
		if (!identifier) {
			return this.builder.visitChildren(ctx) as DocumentSymbolTable;
		}

		const taskSymbol = this.getTaskSymbolFromCurrentScope();
		if (!taskSymbol) {
			return this.builder.visitChildren(ctx) as DocumentSymbolTable;
		}

		taskSymbol.params.push(identifier.getText());
		return this.builder.visitChildren(ctx) as DocumentSymbolTable;
	}

	public visitImplementation(ctx: ImplementationContext): DocumentSymbolTable {
		const fileContext = ctx.fileNameString();
		if (!fileContext) {
			return this.builder.visitChildren(ctx) as DocumentSymbolTable;
		}

		const taskSymbol = this.getTaskSymbolFromCurrentScope();
		if (!taskSymbol) {
			return this.builder.visitChildren(ctx) as DocumentSymbolTable;
		}

		taskSymbol.implementation = fileContext.getText();
		return this.builder.visitChildren(ctx) as DocumentSymbolTable;
	}

	private getTaskSymbolByName(taskName: string): TaskSymbol | undefined {
		const symbols = (this.builder.currentScope?.getNestedSymbolsOfTypeSync(TaskSymbol) ?? []).filter(
			symbol => symbol.name === taskName
		);
		return symbols.length === 1 ? symbols[0] : undefined;
	}


	private getTaskSymbolFromCurrentScope(): TaskSymbol | undefined {
		if (
			!(this.builder.currentScope instanceof TaskConfigurationScopeSymbol) ||
			!this.builder.currentScope.symbolReference
		) {
			return undefined;
		}
		return this.builder.currentScope.symbolReference as TaskSymbol;
	}

}*/

import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';

export class TaskVisitor {
  constructor(private readonly builder: XxpSymbolTableBuilder) {}
}
