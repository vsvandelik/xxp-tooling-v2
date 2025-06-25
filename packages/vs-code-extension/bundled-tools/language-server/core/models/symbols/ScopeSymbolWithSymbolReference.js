import { ScopedSymbol } from 'antlr4-c3';
export class ScopeSymbolWithSymbolReference extends ScopedSymbol {
    symbolReference;
    constructor(name, symbolReference) {
        super(name);
        this.symbolReference = symbolReference;
    }
}
//# sourceMappingURL=ScopeSymbolWithSymbolReference.js.map