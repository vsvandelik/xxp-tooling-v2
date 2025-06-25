import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import { EspaceControlBlockContext, EspaceControlBodyContext, EspaceSimpleTransitionContext, EspaceConditionalTransitionContext } from '@extremexp/core';
export declare class EspaceControlVisitor {
    private readonly builder;
    constructor(builder: EspaceSymbolTableBuilder);
    visitBlock(ctx: EspaceControlBlockContext): DocumentSymbolTable;
    visitBody(ctx: EspaceControlBodyContext): DocumentSymbolTable;
    visitSimpleTransition(ctx: EspaceSimpleTransitionContext): DocumentSymbolTable;
    visitConditionalTransition(ctx: EspaceConditionalTransitionContext): DocumentSymbolTable;
}
//# sourceMappingURL=EspaceControlVisitor.d.ts.map