import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import { EspaceParamDefinitionContext } from '@extremexp/core';
export declare class EspaceParamVisitor {
    private readonly builder;
    constructor(builder: EspaceSymbolTableBuilder);
    visitDefinition(ctx: EspaceParamDefinitionContext): DocumentSymbolTable;
    private extractParamValue;
    private extractEnumValue;
    private extractRangeValue;
    private extractExpressionValue;
}
//# sourceMappingURL=EspaceParamVisitor.d.ts.map