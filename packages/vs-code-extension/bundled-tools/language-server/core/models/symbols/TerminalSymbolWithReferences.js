import { BaseSymbol } from 'antlr4-c3';
import { TerminalSymbolReference } from '../TerminalSymbolReference.js';
export class TerminalSymbolWithReferences extends BaseSymbol {
    document;
    references = [];
    constructor(name, document) {
        super(name);
        this.document = document;
    }
    addReference(symbol, document) {
        this.references.push(new TerminalSymbolReference(symbol, document));
    }
}
//# sourceMappingURL=TerminalSymbolWithReferences.js.map