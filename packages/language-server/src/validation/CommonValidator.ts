// packages/language-server/src/validation/CommonValidator.ts
import { DocumentManager } from '../documents/DocumentManager.js';
import { ValidationResult } from '../types/ValidationTypes.js';
import { ParsedDocument } from '../types/ParsedDocument.js';
import { Range } from 'vscode-languageserver/node';

export class CommonValidator {
  constructor(private documentManager: DocumentManager) {}

  async validate(document: ParsedDocument): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    if (!document.analysis) return results;

    // Check for undefined references
    results.push(...this.checkUndefinedReferences(document));

    // Check for duplicate definitions
    results.push(...this.checkDuplicateDefinitions(document));

    // Check for unused definitions
    results.push(...this.checkUnusedDefinitions(document));

    // Check naming conventions
    results.push(...this.checkNamingConventions(document));

    return results;
  }

  private checkUndefinedReferences(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];
    const symbolTable = this.documentManager.getSymbolTable();

    for (const reference of document.analysis?.references || []) {
      const symbol = symbolTable.resolveSymbol(reference.name, reference.scope, reference.type);
      
      if (!symbol) {
        results.push({
          severity: 'error',
          range: reference.range,
          message: `${this.getSymbolTypeName(reference.type)} '${reference.name}' is not defined`,
          code: 'undefined-reference',
          data: {
            name: reference.name,
            type: reference.type,
          },
        });
      }
    }

    return results;
  }

  private checkDuplicateDefinitions(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];
    const seenSymbols = new Map<string, any>();

    for (const symbol of document.analysis?.symbols || []) {
      const key = `${symbol.scope}:${symbol.name}:${symbol.type}`;
      
      if (seenSymbols.has(key)) {
        const existing = seenSymbols.get(key);
        results.push({
          severity: 'error',
          range: symbol.range,
          message: `Duplicate definition of ${this.getSymbolTypeName(symbol.type)} '${symbol.name}'`,
          code: 'duplicate-definition',
          relatedInformation: [{
            location: {
              uri: document.uri,
              range: existing.range,
            },
            message: 'First definition is here',
          }],
          data: {
            name: symbol.name,
            type: symbol.type,
          },
        });
      } else {
        seenSymbols.set(key, symbol);
      }
    }

    return results;
  }

  private checkUnusedDefinitions(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];
    const symbolTable = this.documentManager.getSymbolTable();

    for (const symbol of document.analysis?.symbols || []) {
      // Skip checking for main constructs (workflows, experiments)
      if (symbol.type === 'workflow' || symbol.type === 'experiment') {
        continue;
      }

      const references = symbolTable.getReferences(symbol.name, symbol.type);
      
      // If the only reference is the definition itself, it's unused
      if (references.length <= 1) {
        results.push({
          severity: 'warning',
          range: symbol.range,
          message: `${this.getSymbolTypeName(symbol.type)} '${symbol.name}' is defined but never used`,
          code: 'unused-definition',
          data: {
            name: symbol.name,
            type: symbol.type,
          },
        });
      }
    }

    return results;
  }

  private checkNamingConventions(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const symbol of document.analysis?.symbols || []) {
      let isValid = true;
      let expectedPattern = '';

      switch (symbol.type) {
        case 'workflow':
        case 'experiment':
          // Should start with uppercase
          isValid = /^[A-Z][a-zA-Z0-9]*$/.test(symbol.name);
          expectedPattern = 'PascalCase (e.g., MyWorkflow)';
          break;
        
        case 'task':
        case 'space':
        case 'parameter':
        case 'data':
          // Should be camelCase
          isValid = /^[a-z][a-zA-Z0-9]*$/.test(symbol.name);
          expectedPattern = 'camelCase (e.g., myTask)';
          break;
      }

      if (!isValid) {
        results.push({
          severity: 'info',
          range: symbol.range,
          message: `${this.getSymbolTypeName(symbol.type)} '${symbol.name}' should follow ${expectedPattern} naming convention`,
          code: 'naming-convention',
          data: {
            name: symbol.name,
            type: symbol.type,
            expectedPattern,
          },
        });
      }
    }

    return results;
  }

  private getSymbolTypeName(type: string): string {
    const typeNames: Record<string, string> = {
      workflow: 'Workflow',
      experiment: 'Experiment',
      space: 'Space',
      task: 'Task',
      parameter: 'Parameter',
      data: 'Data',
      strategy: 'Strategy',
    };
    return typeNames[type] || type;
  }
}