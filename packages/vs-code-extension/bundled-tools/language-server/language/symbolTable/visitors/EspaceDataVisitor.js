import { DataSymbol } from '../../../core/models/symbols/DataSymbol.js';
import { addSymbolOfTypeWithContext } from '../helpers/SymbolHelpers.js';
export class EspaceDataVisitor {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    visitDefinition(ctx) {
        const identifier = ctx.IDENTIFIER();
        const schemaString = ctx.STRING();
        if (!identifier) {
            return this.builder.visitChildren(ctx);
        }
        const dataName = identifier.getText();
        const schemaPath = schemaString ? schemaString.getText() : undefined;
        addSymbolOfTypeWithContext(this.builder, DataSymbol, dataName, ctx, this.builder.currentScope, this.builder.document, schemaPath);
        return this.builder.visitChildren(ctx);
    }
}
//# sourceMappingURL=EspaceDataVisitor.js.map