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

export class ParamSymbol extends TerminalSymbolWithReferences {
  constructor(
    name: string,
    document: Document,
    public value?: ParamValue
  ) {
    super(name, document);
  }
}
