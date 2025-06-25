import { SymbolTable } from 'antlr4-c3';
import { TerminalSymbolReference } from '../TerminalSymbolReference.js';
export class WorkflowSymbol extends SymbolTable {
    document;
    parentWorkflowSymbol;
    references = [];
    constructor(name, document) {
        super(name, { allowDuplicateSymbols: false });
        this.document = document;
    }
    clear() {
        super.clear();
        this.parentWorkflowSymbol = undefined;
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
    getSymbolsOfType(t) {
        const foundSymbols = super.getSymbolsOfType(t);
        if (this.parentWorkflowSymbol) {
            return foundSymbols.then(async (symbols) => {
                const parentSymbols = await this.parentWorkflowSymbol.getSymbolsOfType(t);
                return symbols.concat(parentSymbols);
            });
        }
        return foundSymbols;
    }
    getNestedSymbolsOfTypeSync(t) {
        const foundSymbols = super.getNestedSymbolsOfTypeSync(t);
        if (this.parentWorkflowSymbol) {
            const parentSymbols = this.parentWorkflowSymbol.getNestedSymbolsOfTypeSync(t);
            return foundSymbols.concat(parentSymbols);
        }
        return foundSymbols;
    }
    getAllNestedSymbols(name) {
        return super.getAllNestedSymbols(name).then(async (symbols) => {
            if (this.parentWorkflowSymbol) {
                const parentSymbols = await this.parentWorkflowSymbol.getAllNestedSymbols(name);
                return symbols.concat(parentSymbols);
            }
            return symbols;
        });
    }
    getAllNestedSymbolsSync(name) {
        const foundSymbols = super.getAllNestedSymbolsSync(name);
        if (this.parentWorkflowSymbol) {
            const parentSymbols = this.parentWorkflowSymbol.getAllNestedSymbolsSync(name);
            return foundSymbols.concat(parentSymbols);
        }
        return foundSymbols;
    }
    getAllSymbols(t, localOnly) {
        const foundSymbols = super.getAllSymbols(t, localOnly);
        if (this.parentWorkflowSymbol) {
            return foundSymbols.then(async (symbols) => {
                const parentSymbols = await this.parentWorkflowSymbol.getAllSymbols(t, localOnly);
                return symbols.concat(parentSymbols);
            });
        }
        return foundSymbols;
    }
    getAllSymbolsSync(t, localOnly) {
        const foundSymbols = super.getAllSymbolsSync(t, localOnly);
        if (this.parentWorkflowSymbol) {
            const parentSymbols = this.parentWorkflowSymbol.getAllSymbolsSync(t, localOnly);
            return foundSymbols.concat(parentSymbols);
        }
        return foundSymbols;
    }
    getNestedSymbolsOfType(t) {
        const foundSymbols = super.getNestedSymbolsOfType(t);
        if (this.parentWorkflowSymbol) {
            return foundSymbols.then(async (symbols) => {
                const parentSymbols = await this.parentWorkflowSymbol.getNestedSymbolsOfType(t);
                return symbols.concat(parentSymbols);
            });
        }
        return foundSymbols;
    }
    resolve(name, localOnly) {
        return super.resolve(name, localOnly).then(async (symbol) => {
            if (symbol) {
                return symbol;
            }
            if (this.parentWorkflowSymbol) {
                return this.parentWorkflowSymbol.resolve(name, localOnly);
            }
            return undefined;
        });
    }
    resolveSync(name, localOnly) {
        const symbol = super.resolveSync(name, localOnly);
        if (symbol) {
            return symbol;
        }
        if (this.parentWorkflowSymbol) {
            return this.parentWorkflowSymbol.resolveSync(name, localOnly);
        }
        return undefined;
    }
    addReference(symbol, document) {
        this.references.push(new TerminalSymbolReference(symbol, document));
    }
}
//# sourceMappingURL=WorkflowSymbol.js.map