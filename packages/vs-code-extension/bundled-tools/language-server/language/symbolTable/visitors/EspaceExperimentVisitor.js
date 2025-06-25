import { ExperimentSymbol } from '../../../core/models/symbols/ExperimentSymbol.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addSymbolOfTypeWithContext } from '../helpers/SymbolHelpers.js';
export class EspaceExperimentVisitor {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    visitHeader(ctx) {
        const identifier = ctx.IDENTIFIER();
        if (!identifier) {
            return this.builder.visitChildren(ctx);
        }
        const experimentName = identifier.getText();
        const experimentSymbol = this.getExistingExperimentSymbolTable(experimentName) ||
            addSymbolOfTypeWithContext(this.builder, ExperimentSymbol, experimentName, ctx.parent, this.builder.currentScope, this.builder.document);
        if (!experimentSymbol) {
            return this.builder.defaultResult();
        }
        this.builder.currentScope = experimentSymbol;
        return this.builder.defaultResult();
    }
    visitBody(ctx) {
        return this.builder.visitChildren(ctx);
    }
    getExistingExperimentSymbolTable(experimentName) {
        if (!(this.builder.currentScope instanceof DocumentSymbolTable)) {
            throw new Error('Current scope is not a DocumentSymbolTable');
        }
        const existingExperimentSymbolRaw = this.builder.symbolTable.children.find(c => c instanceof ExperimentSymbol && c.name === experimentName);
        if (!existingExperimentSymbolRaw)
            return;
        const existingExperimentSymbol = existingExperimentSymbolRaw;
        if (existingExperimentSymbol.document.uri === this.builder.document.uri) {
            existingExperimentSymbol.clear();
            return existingExperimentSymbol;
        }
        return undefined;
    }
}
//# sourceMappingURL=EspaceExperimentVisitor.js.map