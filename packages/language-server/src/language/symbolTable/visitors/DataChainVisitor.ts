/*import { ChainPartType } from '../types';
import { ParserRuleContext } from 'antlr4ng';
import { DataSymbol } from '../../../core/models/symbols/DataSymbol';
import { DocumentSymbolTable } from '../documentSymbolTable';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder';
import { DataChainContext, DataNameReadContext, TaskNameReadContext } from '../../generated/XXPParser';

export class DataChainVisitor {
	constructor(private readonly builder: XxpSymbolTableBuilder) { }

	public visitChain(ctx: DataChainContext): DocumentSymbolTable {
		// Check if first identifier is a data symbol to determine starting chain type
		const validDataSymbols = this.builder.currentScope?.getNestedSymbolsOfTypeSync(DataSymbol) ?? [];
		const firstIdentifier = ctx.children[0].getText();

		// Initialize chain type (if first part is data, next is task and vice versa)
		let currentChainPartType = validDataSymbols.some(s => s.name === firstIdentifier)
			? ChainPartType.Task
			: ChainPartType.Data;

		// Process alternating chain parts
		for (let i = 0; i < ctx.children.length; i += 2) {
			// Switch to next type in alternating pattern
			currentChainPartType = currentChainPartType === ChainPartType.Data
				? ChainPartType.Task
				: ChainPartType.Data;

			// Skip non-parser rule contexts (like operators)
			if (!(ctx.children[i] instanceof ParserRuleContext)) {
				continue;
			}

			// Process appropriate symbol based on current type
			if (currentChainPartType === ChainPartType.Data) {
				this.builder.visitDataNameRead(ctx.children[i] as DataNameReadContext);
			} else {
				this.builder.visitTaskNameRead(ctx.children[i] as TaskNameReadContext);
			}
		}

		return this.builder.symbolTable;
	}
}*/
