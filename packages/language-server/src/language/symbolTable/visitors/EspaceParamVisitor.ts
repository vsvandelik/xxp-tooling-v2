import { ParamSymbol, ParamValue } from '../../../core/models/symbols/ParamSymbol.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addSymbolOfTypeWithContext } from '../helpers/SymbolHelpers.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import {
  EspaceParamDefinitionContext,
  EspaceEnumFunctionContext,
  EspaceRangeFunctionContext,
  EspaceExpressionContext,
} from '@extremexp/core';

export class EspaceParamVisitor {
  constructor(private readonly builder: EspaceSymbolTableBuilder) {}

  public visitDefinition(ctx: EspaceParamDefinitionContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    const paramValue = ctx.paramValue();

    if (!identifier || !paramValue) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const paramName = identifier.getText();
    const value = this.extractParamValue(paramValue);

    addSymbolOfTypeWithContext(
      this.builder,
      ParamSymbol,
      paramName,
      ctx,
      this.builder.currentScope,
      this.builder.document,
      value
    );

    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }

  private extractParamValue(ctx: any): ParamValue | undefined {
    const enumFunc = ctx.enumFunction();
    const rangeFunc = ctx.rangeFunction();
    const expr = ctx.expression();

    if (enumFunc) {
      return this.extractEnumValue(enumFunc);
    } else if (rangeFunc) {
      return this.extractRangeValue(rangeFunc);
    } else if (expr) {
      return this.extractExpressionValue(expr);
    }

    return undefined;
  }

  private extractEnumValue(ctx: EspaceEnumFunctionContext): ParamValue {
    const expressions = ctx.expression();
    const values: string[] = expressions.map(expr => expr.getText());

    return {
      type: 'enum',
      values,
    };
  }

  private extractRangeValue(ctx: EspaceRangeFunctionContext): ParamValue {
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
      min: parseFloat(numbers[0]!.getText()),
      max: parseFloat(numbers[1]!.getText()),
      step: parseFloat(numbers[2]!.getText()),
    };
  }

  private extractExpressionValue(ctx: EspaceExpressionContext): ParamValue {
    return {
      type: 'expression',
      value: ctx.getText(),
    };
  }
}
