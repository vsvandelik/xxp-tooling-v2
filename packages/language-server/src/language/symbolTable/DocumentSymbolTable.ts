import { BaseSymbol, ScopedSymbol, SymbolTable } from 'antlr4-c3';
import { ParseTree } from 'antlr4ng';
import { WorkflowSymbol } from '../../core/models/symbols/WorkflowSymbol.js';

export class DocumentSymbolTable extends SymbolTable {
  constructor(name: string) {
    super(name, { allowDuplicateSymbols: false });
  }

  public async getValidSymbolsAtPosition<T extends BaseSymbol>(
    parseTree: ParseTree,
    type: new (...args: any[]) => T
  ): Promise<string[]> {
    const currentContext = parseTree;

    // Generic approach: always try to get symbols from all workflows first
    // This ensures inheritance works for any symbol type (TaskSymbol, DataSymbol, etc.)
    const workflows = await this.getSymbolsOfType(WorkflowSymbol as any);
    if (workflows.length > 0) {
      const allSymbols: T[] = [];
      const symbolNames = new Set<string>(); // Use Set to avoid duplicates

      for (const workflow of workflows) {
        if (workflow instanceof WorkflowSymbol) {
          const workflowSymbols = await workflow.getSymbolsOfType(type);
          for (const symbol of workflowSymbols) {
            if (!symbolNames.has(symbol.name)) {
              symbolNames.add(symbol.name);
              allSymbols.push(symbol);
            }
          }
        }
      }

      // If we found symbols using the workflow approach, return them
      if (allSymbols.length > 0) {
        return allSymbols.map(s => s.name);
      }
    }

    // Fall back to original scope-based logic if no workflows exist or no symbols found
    if (!currentContext) return [];
    let scope = DocumentSymbolTable.symbolWithContextRecursive(this, currentContext);
    while (scope && !(scope instanceof ScopedSymbol)) {
      scope = scope.parent;
    }

    let symbols: T[];
    if (scope instanceof ScopedSymbol) {
      symbols = await scope.getSymbolsOfType(type);
    } else {
      symbols = await this.getSymbolsOfType(type);
    }
    return symbols.map(s => s.name);
  }

  private static symbolWithContextRecursive(
    root: ScopedSymbol,
    context: ParseTree
  ): BaseSymbol | undefined {
    for (const child of root.children) {
      if (!child.context) continue;

      if (child.context.getSourceInterval().properlyContains(context.getSourceInterval())) {
        let foundSymbol: BaseSymbol | undefined;

        if (child instanceof ScopedSymbol) {
          foundSymbol = this.symbolWithContextRecursive(child, context);
        } else if (child.context === context) {
          foundSymbol = child;
        }

        if (foundSymbol) {
          return foundSymbol;
        } else {
          return child;
        }
      }
    }

    return undefined;
  }
}
