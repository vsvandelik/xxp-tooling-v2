import { BaseSymbol, ScopedSymbol, SymbolTable } from 'antlr4-c3';
import { ParseTree } from 'antlr4ng';

export class DocumentSymbolTable extends SymbolTable {
  constructor(name: string) {
    super(name, { allowDuplicateSymbols: false });
  }

  public async getValidSymbolsAtPosition<T extends BaseSymbol>(
    parseTree: ParseTree,
    type: new (...args: any[]) => T
  ): Promise<string[]> {
    const currentContext = parseTree;
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

  /**
   * Synchronous version of getAllNestedSymbols for use in symbol builders
   */
  public override getAllNestedSymbolsSync(): BaseSymbol[] {
    const symbols: BaseSymbol[] = [];
    this.collectNestedSymbolsSync(this, symbols);
    return symbols;
  }

  /**
   * Synchronous version of getNestedSymbolsOfType
   */
  public override getNestedSymbolsOfTypeSync<T extends BaseSymbol>(
    type: new (...args: any[]) => T
  ): T[] {
    const allSymbols = this.getAllNestedSymbolsSync();
    return allSymbols.filter(s => s instanceof type) as T[];
  }

  private collectNestedSymbolsSync(scope: ScopedSymbol, symbols: BaseSymbol[]): void {
    for (const child of scope.children) {
      symbols.push(child);
      if (child instanceof ScopedSymbol) {
        this.collectNestedSymbolsSync(child, symbols);
      }
    }
  }

  private static symbolWithContextRecursive(
    root: ScopedSymbol,
    context: ParseTree
  ): BaseSymbol | undefined {
    for (const child of root.children) {
      if (!(child as any).context) continue;

      if (
        (child as any).context.getSourceInterval().properlyContains(context.getSourceInterval())
      ) {
        let foundSymbol: BaseSymbol | undefined;

        if (child instanceof ScopedSymbol) {
          foundSymbol = this.symbolWithContextRecursive(child, context);
        } else if ((child as any).context === context) {
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
