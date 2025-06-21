import { Range, DiagnosticRelatedInformation } from 'vscode-languageserver/node';

export interface ValidationResult {
  severity: 'error' | 'warning' | 'info' | 'hint';
  range: Range;
  message: string;
  code?: string | number;
  source?: string;
  relatedInformation?: DiagnosticRelatedInformation[];
  data?: any;
}

export interface ValidationContext {
  uri: string;
  languageId: string;
  symbols: any[];
  references: any[];
}
