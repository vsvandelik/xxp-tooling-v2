import { TerminalSymbolWithReferences } from './TerminalSymbolWithReferences.js';
export class DataSymbol extends TerminalSymbolWithReferences {
    schemaFilePath;
    constructor(name, document, schemaFilePath) {
        super(name, document);
        this.schemaFilePath = schemaFilePath;
    }
}
//# sourceMappingURL=DataSymbol.js.map