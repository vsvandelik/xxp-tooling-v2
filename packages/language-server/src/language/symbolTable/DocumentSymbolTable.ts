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
    
    // For TaskSymbol, always use the comprehensive approach to ensure inheritance works
    if (type.name === 'TaskSymbol') {
      const workflows = await this.getSymbolsOfType(WorkflowSymbol as any);
      const allTasks: T[] = [];
      const taskNames = new Set<string>(); // Use Set to avoid duplicates
      
      for (const workflow of workflows) {
        if (workflow instanceof WorkflowSymbol) {
          const workflowTasks = await workflow.getSymbolsOfType(type);
          for (const task of workflowTasks) {
            if (!taskNames.has(task.name)) {
              taskNames.add(task.name);
              allTasks.push(task);
            }
          }
        }
      }
      return allTasks.map(s => s.name);
    }
    
    if (!currentContext) return [];
    
    // For non-TaskSymbol types, use the original logic
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
