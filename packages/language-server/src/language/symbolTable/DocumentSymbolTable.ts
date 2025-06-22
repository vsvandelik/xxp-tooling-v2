import { BaseSymbol, ScopedSymbol, SymbolTable } from "antlr4-c3";
import { ParseTree } from 'antlr4ng';

export class DocumentSymbolTable extends SymbolTable {

	constructor(name: string) {
		super(name, { allowDuplicateSymbols: false });
	}

	public async getValidSymbolsAtPosition<T extends BaseSymbol>(parseTree: ParseTree, type: new (...args: any[]) => T): Promise<string[]> {
		const currentContext = parseTree;
		if (!currentContext) return [];
		let scope = DocumentSymbolTable.symbolWithContextRecursive(this, currentContext);
		while (scope && !(scope instanceof ScopedSymbol)) {
			scope = scope.parent;
		}

		let symbols: T[];
		if (scope instanceof ScopedSymbol) {
			symbols = await scope.getSymbolsOfType(type);
		} else {
			symbols = await this.getSymbolsOfType(type);
		}
		return symbols.map(s => s.name);
	}

	private static symbolWithContextRecursive(root: ScopedSymbol, context: ParseTree): BaseSymbol | undefined {
		for (const child of root.children) {
			if (!child.context) continue;

			if (child.context.getSourceInterval().properlyContains(context.getSourceInterval())) {
				let foundSymbol: BaseSymbol | undefined;

				if (child instanceof ScopedSymbol) {
					foundSymbol = this.symbolWithContextRecursive(child, context);
				} else if (child.context === context) {
					foundSymbol = child;
				}

				if (foundSymbol) {
					return foundSymbol;
				} else {
					return child;
				}
			}
		}

		return undefined;
	}
}