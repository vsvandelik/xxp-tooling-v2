import { BaseSymbol, ScopedSymbol, SymbolTable } from 'antlr4-c3';
import { ParseTree } from 'antlr4ng';
import { WorkflowSymbol } from '../../core/models/symbols/WorkflowSymbol.js';
import { ExperimentSymbol } from '../../core/models/symbols/ExperimentSymbol.js';

export class DocumentSymbolTable extends SymbolTable {
  constructor(name: string) {
    super(name, { allowDuplicateSymbols: false });
  }

  override resolve(name: string, localOnly?: boolean): Promise<BaseSymbol | undefined> {
    console.error(`[SYMBOL] DocumentSymbolTable.resolve: name="${name}", localOnly=${localOnly}`);
    return super.resolve(name, localOnly).then(symbol => {
      if (symbol) {
        console.error(`[SYMBOL] DocumentSymbolTable.resolve: Found: name="${name}", type="${symbol.constructor.name}"`);
      } else {
        console.error(`[SYMBOL] DocumentSymbolTable.resolve: Not found: name="${name}"`);
      }
      return symbol;
    });
  }

  override resolveSync(name: string, localOnly?: boolean): BaseSymbol | undefined {
    console.error(`[SYMBOL] DocumentSymbolTable.resolveSync: name="${name}", localOnly=${localOnly}`);
    const symbol = super.resolveSync(name, localOnly);
    if (symbol) {
      console.error(`[SYMBOL] DocumentSymbolTable.resolveSync: Found: name="${name}", type="${symbol.constructor.name}"`);
    } else {
      console.error(`[SYMBOL] DocumentSymbolTable.resolveSync: Not found: name="${name}"`);
    }
    return symbol;
  }

  public async getValidSymbolsAtPosition<T extends BaseSymbol>(
    parseTree: ParseTree,
    documentUri: string,
    type: new (...args: any[]) => T
  ): Promise<string[]> {
    const currentContext = parseTree;

    // Special handling for SpaceSymbol - look in current document's experiments, not workflows
    if (type.name === 'SpaceSymbol') {
      // Find ExperimentSymbol and get SpaceSymbols from it
      const experiments = await this.getSymbolsOfType(ExperimentSymbol as any);
      
      const spaceNames: string[] = [];
      for (const experiment of experiments) {
        if (experiment instanceof ScopedSymbol) {
          const spaces = await experiment.getSymbolsOfType(type);
          spaceNames.push(...spaces.map(s => s.name));
        }
      }
      
      return spaceNames;
    }

    if (type.name === 'WorkflowSymbol') {
      const workflows = await this.getSymbolsOfType(WorkflowSymbol as any);
      if (workflows.length > 0) {
        return workflows.map(w => w.name);
      }
    }

    if (!currentContext) return [];
    let currentWorkflowSymbol = DocumentSymbolTable.symbolWithContextRecursive(this, currentContext, documentUri);
    while (currentWorkflowSymbol && !(currentWorkflowSymbol instanceof SymbolTable)) {
      currentWorkflowSymbol = currentWorkflowSymbol.parent;
    }

    const workflows = [currentWorkflowSymbol]
    if (currentWorkflowSymbol instanceof WorkflowSymbol) {
      let workflowSymbol = currentWorkflowSymbol as WorkflowSymbol;
      while (workflowSymbol.parentWorkflowSymbol && workflowSymbol.parentWorkflowSymbol instanceof WorkflowSymbol) {
        workflows.push(workflowSymbol.parentWorkflowSymbol as WorkflowSymbol);
        workflowSymbol = workflowSymbol.parentWorkflowSymbol as WorkflowSymbol;
      }
    }

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
    let scope = DocumentSymbolTable.symbolWithContextRecursive(this, currentContext, documentUri);
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

  public async getCurrentScopeSymbolByType<T extends BaseSymbol>(
    parseTree: ParseTree,
    documentUri: string,
    type: new (...args: any[]) => T
  ): Promise<T | null> {
    const currentContext = parseTree;
    if (!currentContext) return null;

    let scope = DocumentSymbolTable.symbolWithContextRecursive(this, currentContext, documentUri);

    while (scope) {
      if (scope instanceof type) {
        return scope;
      }
      
      scope = scope.parent;
    }

    return null;
  }

  private static symbolWithContextRecursive(
    root: ScopedSymbol,
    context: ParseTree,
    documentUri: string
  ): BaseSymbol | undefined {
    for (const child of root.children) {
      if (!child.context) continue;
      if ((child instanceof WorkflowSymbol && (child as WorkflowSymbol).document.uri !== documentUri) || (child instanceof ExperimentSymbol && (child as ExperimentSymbol).document.uri !== documentUri)) continue;

      if (child.context.getSourceInterval().properlyContains(context.getSourceInterval())) {
        let foundSymbol: BaseSymbol | undefined;

        if (child instanceof ScopedSymbol) {
          foundSymbol = this.symbolWithContextRecursive(child, context, documentUri);
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
