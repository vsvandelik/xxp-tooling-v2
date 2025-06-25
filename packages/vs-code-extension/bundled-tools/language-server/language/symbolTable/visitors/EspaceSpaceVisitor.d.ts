import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import { EspaceSpaceDeclarationContext, EspaceSpaceHeaderContext, EspaceSpaceBodyContext, EspaceStrategyStatementContext } from '@extremexp/core';
export declare class EspaceSpaceVisitor {
    private readonly builder;
    constructor(builder: EspaceSymbolTableBuilder);
    visitDeclaration(ctx: EspaceSpaceDeclarationContext): DocumentSymbolTable;
    visitHeader(ctx: EspaceSpaceHeaderContext): DocumentSymbolTable;
    visitBody(ctx: EspaceSpaceBodyContext): DocumentSymbolTable;
    visitStrategy(ctx: EspaceStrategyStatementContext): DocumentSymbolTable;
    private getWorkflowDocument;
    private findSpaceSymbolForBody;
    private findParentSpaceScope;
}
//# sourceMappingURL=EspaceSpaceVisitor.d.ts.map