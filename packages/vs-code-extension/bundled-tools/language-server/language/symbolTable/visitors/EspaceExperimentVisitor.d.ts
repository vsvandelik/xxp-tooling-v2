import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import { EspaceExperimentHeaderContext, EspaceExperimentBodyContext } from '@extremexp/core';
export declare class EspaceExperimentVisitor {
    private readonly builder;
    constructor(builder: EspaceSymbolTableBuilder);
    visitHeader(ctx: EspaceExperimentHeaderContext): DocumentSymbolTable;
    visitBody(ctx: EspaceExperimentBodyContext): DocumentSymbolTable;
    private getExistingExperimentSymbolTable;
}
//# sourceMappingURL=EspaceExperimentVisitor.d.ts.map