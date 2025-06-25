import { TerminalSymbolWithReferences } from './TerminalSymbolWithReferences.js';
export class ParamSymbol extends TerminalSymbolWithReferences {
    value;
    constructor(name, document, value) {
        super(name, document);
        this.value = value;
    }
}
//# sourceMappingURL=ParamSymbol.js.map