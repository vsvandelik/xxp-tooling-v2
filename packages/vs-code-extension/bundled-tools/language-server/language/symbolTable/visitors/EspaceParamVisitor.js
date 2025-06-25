import { ParamSymbol } from '../../../core/models/symbols/ParamSymbol.js';
import { addSymbolOfTypeWithContext } from '../helpers/SymbolHelpers.js';
export class EspaceParamVisitor {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    visitDefinition(ctx) {
        const identifier = ctx.IDENTIFIER();
        const paramValue = ctx.paramValue();
        if (!identifier || !paramValue) {
            return this.builder.visitChildren(ctx);
        }
        const paramName = identifier.getText();
        const value = this.extractParamValue(paramValue);
        addSymbolOfTypeWithContext(this.builder, ParamSymbol, paramName, ctx, this.builder.currentScope, this.builder.document, value);
        return this.builder.visitChildren(ctx);
    }
    extractParamValue(ctx) {
        const enumFunc = ctx.enumFunction();
        const rangeFunc = ctx.rangeFunction();
        const expr = ctx.expression();
        if (enumFunc) {
            return this.extractEnumValue(enumFunc);
        }
        else if (rangeFunc) {
            return this.extractRangeValue(rangeFunc);
        }
        else if (expr) {
            return this.extractExpressionValue(expr);
        }
        return undefined;
    }
    extractEnumValue(ctx) {
        const expressions = ctx.expression();
        const values = expressions.map(expr => expr.getText());
        return {
            type: 'enum',
            values,
        };
    }
    extractRangeValue(ctx) {
        const numbers = ctx.NUMBER();
        if (numbers.length !== 3) {
            return {
                type: 'range',
                min: 0,
                max: 1,
                step: 1,
            };
        }
        return {
            type: 'range',
            min: parseFloat(numbers[0].getText()),
            max: parseFloat(numbers[1].getText()),
            step: parseFloat(numbers[2].getText()),
        };
    }
    extractExpressionValue(ctx) {
        return {
            type: 'expression',
            value: ctx.getText(),
        };
    }
}
//# sourceMappingURL=EspaceParamVisitor.js.map