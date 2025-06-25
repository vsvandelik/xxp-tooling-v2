import { SymbolTable } from 'antlr4-c3';
import { TerminalSymbolReference } from '../TerminalSymbolReference.js';
export class ExperimentSymbol extends SymbolTable {
    document;
    references = [];
    constructor(name, document) {
        super(name, { allowDuplicateSymbols: false });
        this.document = document;
    }
    clear() {
        super.clear();
        for (const document of this.document.documentsThisDependsOn) {
            for (const dependingDoc of document.documentsDependingOnThis) {
                if (dependingDoc.uri === this.document.uri) {
                    document.documentsDependingOnThis.delete(dependingDoc);
                    break;
                }
            }
        }
        this.document.documentsThisDependsOn.clear();
    }
    addReference(symbol, document) {
        this.references.push(new TerminalSymbolReference(symbol, document));
    }
}
//# sourceMappingURL=ExperimentSymbol.js.map