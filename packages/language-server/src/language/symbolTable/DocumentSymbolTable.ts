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
      console.log(`Debug - getValidSymbolsAtPosition: found scope of type ${scope.constructor.name}, name: ${scope.name}`);
      symbols = await scope.getSymbolsOfType(type);
      console.log(`Debug - getValidSymbolsAtPosition: scope.getSymbolsOfType(${type.name}) returned:`, symbols.map(s => s.name));
    } else {
      console.log(`Debug - getValidSymbolsAtPosition: no scoped symbol found, using document symbol table`);
      symbols = await this.getSymbolsOfType(type);
      console.log(`Debug - getValidSymbolsAtPosition: this.getSymbolsOfType(${type.name}) returned:`, symbols.map(s => s.name));
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
