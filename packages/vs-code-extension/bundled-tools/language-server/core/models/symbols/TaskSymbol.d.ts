import { Document } from '../../documents/Document.js';
import { Param } from '../Param.js';
import { TerminalSymbolWithReferences } from './TerminalSymbolWithReferences.js';
import { WorkflowSymbol } from './WorkflowSymbol.js';
export declare class TaskSymbol extends TerminalSymbolWithReferences {
    implementation?: (WorkflowSymbol | string) | undefined;
    params: Param[];
    inputData: string[];
    outputData: string[];
    constructor(name: string, document: Document, implementation?: (WorkflowSymbol | string) | undefined, params?: Param[], inputData?: string[], outputData?: string[]);
}
//# sourceMappingURL=TaskSymbol.d.ts.map