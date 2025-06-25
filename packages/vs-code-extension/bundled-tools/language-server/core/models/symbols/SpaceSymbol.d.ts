import { Document } from '../../documents/Document.js';
import { WorkflowSymbol } from './WorkflowSymbol.js';
import { TerminalSymbolWithReferences } from './TerminalSymbolWithReferences.js';
export declare class SpaceSymbol extends TerminalSymbolWithReferences {
    workflowReference?: WorkflowSymbol | undefined;
    strategy?: string | undefined;
    constructor(name: string, document: Document, workflowReference?: WorkflowSymbol | undefined, strategy?: string | undefined);
}
//# sourceMappingURL=SpaceSymbol.d.ts.map