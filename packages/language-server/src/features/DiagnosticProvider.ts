// packages/language-server/src/features/DiagnosticProvider.ts
import { Connection, Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentManager } from '../documents/DocumentManager.js';
import { XXPValidator } from '../validation/XXPValidator.js';
import { ESPACEValidator } from '../validation/ESPACEValidator.js';
import { CommonValidator } from '../validation/CommonValidator.js';
import { ValidationResult } from '../types/ValidationTypes.js';

export class DiagnosticProvider {
  private connection: Connection;
  private documentManager: DocumentManager;
  private xxpValidator: XXPValidator;
  private espaceValidator: ESPACEValidator;
  private commonValidator: CommonValidator;
  private hasDiagnosticRelatedInformation: boolean;

  constructor(
    connection: Connection,
    documentManager: DocumentManager,
    hasDiagnosticRelatedInformation: boolean
  ) {
    this.connection = connection;
    this.documentManager = documentManager;
    this.hasDiagnosticRelatedInformation = hasDiagnosticRelatedInformation;

    this.xxpValidator = new XXPValidator(documentManager);
    this.espaceValidator = new ESPACEValidator(documentManager);
    this.commonValidator = new CommonValidator(documentManager);
  }

  async validateDocument(textDocument: TextDocument): Promise<void> {
    const parsedDoc = this.documentManager.getDocument(textDocument.uri);
    if (!parsedDoc) return;

    const diagnostics: Diagnostic[] = [];

    // Add parsing errors
    diagnostics.push(...parsedDoc.diagnostics);

    // Only run semantic validation if parsing succeeded
    if (parsedDoc.parseTree && parsedDoc.analysis) {
      const validationResults = await this.runValidations(parsedDoc);

      // Convert validation results to diagnostics
      for (const result of validationResults) {
        diagnostics.push(this.createDiagnostic(result));
      }
    }

    // Send diagnostics to client
    this.connection.sendDiagnostics({
      uri: textDocument.uri,
      diagnostics,
    });
  }

  private async runValidations(parsedDoc: any): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Run common validations
    results.push(...(await this.commonValidator.validate(parsedDoc)));

    // Run language-specific validations
    if (parsedDoc.languageId === 'xxp') {
      results.push(...(await this.xxpValidator.validate(parsedDoc)));
    } else if (parsedDoc.languageId === 'espace') {
      results.push(...(await this.espaceValidator.validate(parsedDoc)));
    }

    return results;
  }

  private createDiagnostic(result: ValidationResult): Diagnostic {
    const diagnostic: Diagnostic = {
      severity: this.getSeverity(result.severity),
      range: result.range || this.createDefaultRange(),
      message: result.message,
      source: 'extremexp',
      code: result.code,
    };

    if (this.hasDiagnosticRelatedInformation && result.relatedInformation) {
      diagnostic.relatedInformation = result.relatedInformation;
    }

    if (result.data) {
      diagnostic.data = result.data;
    }

    return diagnostic;
  }

  private getSeverity(severity: string): DiagnosticSeverity {
    switch (severity) {
      case 'error':
        return DiagnosticSeverity.Error;
      case 'warning':
        return DiagnosticSeverity.Warning;
      case 'info':
        return DiagnosticSeverity.Information;
      case 'hint':
        return DiagnosticSeverity.Hint;
      default:
        return DiagnosticSeverity.Error;
    }
  }

  private createDefaultRange(): Range {
    return {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    };
  }
}
