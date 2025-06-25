import { ScopedSymbol, SymbolTable } from 'antlr4-c3';
import { WorkflowSymbol } from '../../core/models/symbols/WorkflowSymbol.js';
import { ExperimentSymbol } from '../../core/models/symbols/ExperimentSymbol.js';
export class DocumentSymbolTable extends SymbolTable {
    constructor(name) {
        super(name, { allowDuplicateSymbols: false });
    }
    async getValidSymbolsAtPosition(parseTree, type) {
        const currentContext = parseTree;
        if (type.name === 'SpaceSymbol') {
            const experiments = await this.getSymbolsOfType(ExperimentSymbol);
            const spaceNames = [];
            for (const experiment of experiments) {
                if (experiment instanceof ScopedSymbol) {
                    const spaces = await experiment.getSymbolsOfType(type);
                    spaceNames.push(...spaces.map(s => s.name));
                }
            }
            return spaceNames;
        }
        const workflows = await this.getSymbolsOfType(WorkflowSymbol);
        if (workflows.length > 0) {
            const allSymbols = [];
            const symbolNames = new Set();
            for (const workflow of workflows) {
                if (workflow instanceof WorkflowSymbol) {
                    const workflowSymbols = await workflow.getSymbolsOfType(type);
                    for (const symbol of workflowSymbols) {
                        if (!symbolNames.has(symbol.name)) {
                            symbolNames.add(symbol.name);
                            allSymbols.push(symbol);
                        }
                    }
                }
            }
            if (allSymbols.length > 0) {
                return allSymbols.map(s => s.name);
            }
            if (type.name === 'WorkflowSymbol') {
                return workflows.map(w => w.name);
            }
        }
        if (!currentContext)
            return [];
        let scope = DocumentSymbolTable.symbolWithContextRecursive(this, currentContext);
        while (scope && !(scope instanceof ScopedSymbol)) {
            scope = scope.parent;
        }
        let symbols;
        if (scope instanceof ScopedSymbol) {
            symbols = await scope.getSymbolsOfType(type);
        }
        else {
            symbols = await this.getSymbolsOfType(type);
        }
        return symbols.map(s => s.name);
    }
    static symbolWithContextRecursive(root, context) {
        for (const child of root.children) {
            if (!child.context)
                continue;
            if (child.context.getSourceInterval().properlyContains(context.getSourceInterval())) {
                let foundSymbol;
                if (child instanceof ScopedSymbol) {
                    foundSymbol = this.symbolWithContextRecursive(child, context);
                }
                else if (child.context === context) {
                    foundSymbol = child;
                }
                if (foundSymbol) {
                    return foundSymbol;
                }
                else {
                    return child;
                }
            }
        }
        return undefined;
    }
}
//# sourceMappingURL=DocumentSymbolTable.js.map