import { ControlBlockScopeSymbol } from '../../../core/models/symbols/ControlBlockScopeSymbol.js';
import { visitScopeSymbol } from '../helpers/SymbolHelpers.js';
export class EspaceControlVisitor {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    visitBlock(ctx) {
        const body = ctx.controlBody();
        if (!body) {
            return this.builder.visitChildren(ctx);
        }
        return this.visitBody(body);
    }
    visitBody(ctx) {
        return visitScopeSymbol(this.builder, ControlBlockScopeSymbol, ctx);
    }
    visitSimpleTransition(ctx) {
        const chainElements = ctx.controlChainElement();
        for (const chainElement of chainElements) {
            const spaceName = chainElement.spaceNameRead();
            if (spaceName) {
                this.builder.visit(spaceName);
            }
        }
        return this.builder.defaultResult();
    }
    visitConditionalTransition(ctx) {
        return this.builder.visitChildren(ctx);
    }
}
//# sourceMappingURL=EspaceControlVisitor.js.map