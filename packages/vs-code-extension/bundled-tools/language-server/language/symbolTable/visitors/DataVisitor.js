import { DataSymbol } from '../../../core/models/symbols/DataSymbol.js';
import { addSymbolOfTypeWithInheritanceCheck } from '../helpers/SymbolHelpers.js';
export class DataVisitor {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    visitDefinition(ctx) {
        const identifier = ctx.IDENTIFIER();
        if (!identifier) {
            return this.builder.visitChildren(ctx);
        }
        const dataName = identifier.getText();
        if (!dataName)
            return this.builder.defaultResult();
        addSymbolOfTypeWithInheritanceCheck(this.builder, DataSymbol, dataName, ctx, 'data', this.builder.currentScope, this.builder.document);
        return this.builder.visitChildren(ctx);
    }
}
//# sourceMappingURL=DataVisitor.js.map