import { ParamSymbol, ParamValue } from '../../../core/models/symbols/ParamSymbol.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addSymbolOfTypeWithContext } from '../helpers/SymbolHelpers.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import {
  EspaceParamDefinitionContext,
  EspaceEnumFunctionContext,
  EspaceRangeFunctionContext,
  EspaceExpressionContext,
  XxpParamAssignmentContext,
} from '@extremexp/core';
import { SpaceScopeSymbol } from '../../../core/models/symbols/SpaceScopeSymbol.js';
import { IScopedSymbol, ScopedSymbol } from 'antlr4-c3';
import { SpaceSymbol } from '../../../core/models/symbols/SpaceSymbol.js';

export class EspaceParamVisitor {
  constructor(private readonly builder: EspaceSymbolTableBuilder) {}

  public visitDefinition(ctx: EspaceParamDefinitionContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    const paramValue = ctx.paramValue();

    if (!identifier || !paramValue) {
      // Missing identifier or paramValue
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const paramName = identifier.getText();
    const value = this.extractParamValue(paramValue);

    const paramSymbol = addSymbolOfTypeWithContext(
      this.builder,
      ParamSymbol,
      paramName,
      ctx,
      this.builder.currentScope,
      this.builder.document,
      value
    );

    if(paramSymbol) {
      this.addReferencesToParamsInWorkflowsDefinitions(paramName, paramSymbol);
    }

    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }

  private addReferencesToParamsInWorkflowsDefinitions(paramName: string, paramSymbol: ParamSymbol): void {
    let spaceScopeSymbol: IScopedSymbol | undefined = this.builder.currentScope;
    while (spaceScopeSymbol && !(spaceScopeSymbol instanceof SpaceScopeSymbol)) {
      spaceScopeSymbol = spaceScopeSymbol.parent;
    }

    const spaceSymbol = spaceScopeSymbol?.previousSibling;
    if (!spaceSymbol || !(spaceSymbol instanceof SpaceSymbol) || (spaceSymbol as SpaceSymbol).workflowReference === undefined) {
      return;
    }

    const workflowSymbol = (spaceSymbol as SpaceSymbol).workflowReference;
    workflowSymbol?.getAllNestedSymbolsSync(paramName).forEach(param => {
      if (!(param instanceof ParamSymbol) || !(param.context as XxpParamAssignmentContext)) {
        return;
      }
      paramSymbol.addReference((param.context as XxpParamAssignmentContext).IDENTIFIER(), param.document);
    });
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
