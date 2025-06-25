import { Document } from '../../documents/Document.js';
import { TerminalSymbolWithReferences } from './TerminalSymbolWithReferences.js';
export type ParamValueType = 'enum' | 'range' | 'expression';
export interface EnumValue {
    type: 'enum';
    values: string[];
}
export interface RangeValue {
    type: 'range';
    min: number;
    max: number;
    step: number;
}
export interface ExpressionValue {
    type: 'expression';
    value: string;
}
export type ParamValue = EnumValue | RangeValue | ExpressionValue;
export declare class ParamSymbol extends TerminalSymbolWithReferences {
    value?: ParamValue | undefined;
    constructor(name: string, document: Document, value?: ParamValue | undefined);
}
//# sourceMappingURL=ParamSymbol.d.ts.map