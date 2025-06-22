import { BaseSymbol, ScopedSymbol } from 'antlr4-c3';

export class ScopeSymbolWithSymbolReference extends ScopedSymbol {
	constructor(name?: string, public readonly symbolReference?: BaseSymbol) {
		super(name);
	}
}