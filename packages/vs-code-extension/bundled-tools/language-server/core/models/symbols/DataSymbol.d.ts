import { Document } from '../../documents/Document.js';
import { TerminalSymbolWithReferences } from './TerminalSymbolWithReferences.js';
export declare class DataSymbol extends TerminalSymbolWithReferences {
    schemaFilePath?: string | undefined;
    constructor(name: string, document: Document, schemaFilePath?: string | undefined);
}
//# sourceMappingURL=DataSymbol.d.ts.map