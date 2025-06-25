import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import { XxpFileNameStringContext } from '@extremexp/core';
export declare class FileVisitor {
    private readonly builder;
    constructor(builder: XxpSymbolTableBuilder);
    visitFileName(ctx: XxpFileNameStringContext): DocumentSymbolTable;
}
//# sourceMappingURL=FileVisitor.d.ts.map