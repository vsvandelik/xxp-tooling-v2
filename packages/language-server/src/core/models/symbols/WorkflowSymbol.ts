import { BaseSymbol, SymbolConstructor, SymbolTable } from 'antlr4-c3';
import { Document } from '../../documents/Document.js';
import { TerminalSymbolReference } from '../TerminalSymbolReference.js';
import { TerminalNode } from 'antlr4ng';

export class WorkflowSymbol extends SymbolTable {
  public parentWorkflowSymbol?: WorkflowSymbol;
  public references: TerminalSymbolReference[] = [];

  constructor(
    name: string,
    public document: Document
  ) {
    super(name, { allowDuplicateSymbols: false });
  }

  override clear(): void {
    super.clear();
    this.parentWorkflowSymbol = undefined;
    // Ignored for now as I am creating document every time
    for (const document of this.document.documentsThisDependsOn) {
      for (const dependingDoc of document.documentsDependingOnThis) {
        if (dependingDoc.uri === this.document.uri) {
          document.documentsDependingOnThis.delete(dependingDoc);
          break;
        }
      }
    }
    this.document.documentsThisDependsOn.clear();
  }

  override getSymbolsOfType<T extends BaseSymbol, Args extends unknown[]>(
    t: SymbolConstructor<T, Args>
  ): Promise<T[]> {
    const foundSymbols = super.getSymbolsOfType(t);

    if (this.parentWorkflowSymbol) {
      return foundSymbols.then(async symbols => {
        const parentSymbols = await this.parentWorkflowSymbol!.getSymbolsOfType(t);
        return symbols.concat(parentSymbols);
      });
    }

    return foundSymbols;
  }

  override getNestedSymbolsOfTypeSync<T extends BaseSymbol, Args extends unknown[]>(
    t: SymbolConstructor<T, Args>
  ): T[] {
    const foundSymbols = super.getNestedSymbolsOfTypeSync(t);

    if (this.parentWorkflowSymbol) {
      const parentSymbols = this.parentWorkflowSymbol.getNestedSymbolsOfTypeSync(t);
      return foundSymbols.concat(parentSymbols);
    }

    return foundSymbols;
  }

  override getAllNestedSymbols(name?: string): Promise<BaseSymbol[]> {
    return super.getAllNestedSymbols(name).then(async symbols => {
      if (this.parentWorkflowSymbol) {
        const parentSymbols = await this.parentWorkflowSymbol.getAllNestedSymbols(name);
        return symbols.concat(parentSymbols);
      }

      return symbols;
    });
  }

  override getAllNestedSymbolsSync(name?: string): BaseSymbol[] {
    const foundSymbols = super.getAllNestedSymbolsSync(name);

    if (this.parentWorkflowSymbol) {
      const parentSymbols = this.parentWorkflowSymbol.getAllNestedSymbolsSync(name);
      return foundSymbols.concat(parentSymbols);
    }

    return foundSymbols;
  }

  override getAllSymbols<T extends BaseSymbol, Args extends unknown[]>(
    t: SymbolConstructor<T, Args>,
    localOnly?: boolean
  ): Promise<T[]> {
    const foundSymbols = super.getAllSymbols(t, localOnly);

    if (this.parentWorkflowSymbol) {
      return foundSymbols.then(async symbols => {
        const parentSymbols = await this.parentWorkflowSymbol!.getAllSymbols(t, localOnly);
        return symbols.concat(parentSymbols);
      });
    }

    return foundSymbols;
  }

  override getAllSymbolsSync<T extends BaseSymbol, Args extends unknown[]>(
    t: SymbolConstructor<T, Args>,
    localOnly?: boolean
  ): T[] {
    const foundSymbols = super.getAllSymbolsSync(t, localOnly);

    if (this.parentWorkflowSymbol) {
      const parentSymbols = this.parentWorkflowSymbol.getAllSymbolsSync(t, localOnly);
      return foundSymbols.concat(parentSymbols);
    }

    return foundSymbols;
  }

  override getNestedSymbolsOfType<T extends BaseSymbol, Args extends unknown[]>(
    t: SymbolConstructor<T, Args>
  ): Promise<T[]> {
    const foundSymbols = super.getNestedSymbolsOfType(t);

    if (this.parentWorkflowSymbol) {
      return foundSymbols.then(async symbols => {
        const parentSymbols = await this.parentWorkflowSymbol!.getNestedSymbolsOfType(t);
        return symbols.concat(parentSymbols);
      });
    }

    return foundSymbols;
  }

  override resolve(name: string, localOnly?: boolean): Promise<BaseSymbol | undefined> {
    console.error(`[SYMBOL] WorkflowSymbol.resolve: name="${name}", localOnly=${localOnly}, workflow="${this.name}"`);
    return super.resolve(name, localOnly).then(async symbol => {
      if (symbol) {
        console.error(`[SYMBOL] WorkflowSymbol.resolve: Found locally: name="${name}", type="${symbol.constructor.name}"`);
        return symbol;
      }

      if (this.parentWorkflowSymbol) {
        console.error(`[SYMBOL] WorkflowSymbol.resolve: Searching in parent: "${this.parentWorkflowSymbol.name}"`);
        return this.parentWorkflowSymbol.resolve(name, localOnly);
      }

      console.error(`[SYMBOL] WorkflowSymbol.resolve: Not found: name="${name}"`);
      return undefined;
    });
  }

  override resolveSync(name: string, localOnly?: boolean): BaseSymbol | undefined {
    console.error(`[SYMBOL] WorkflowSymbol.resolveSync: name="${name}", localOnly=${localOnly}, workflow="${this.name}"`);
    const symbol = super.resolveSync(name, localOnly);

    if (symbol) {
      console.error(`[SYMBOL] WorkflowSymbol.resolveSync: Found locally: name="${name}", type="${symbol.constructor.name}"`);
      return symbol;
    }

    if (this.parentWorkflowSymbol) {
      console.error(`[SYMBOL] WorkflowSymbol.resolveSync: Searching in parent: "${this.parentWorkflowSymbol.name}"`);
      return this.parentWorkflowSymbol.resolveSync(name, localOnly);
    }

    console.error(`[SYMBOL] WorkflowSymbol.resolveSync: Not found: name="${name}"`);
    return undefined;
  }

  addReference(symbol: TerminalNode, document: Document): void {
    console.error(`[SYMBOL] WorkflowSymbol.addReference: workflow="${this.name}", text="${symbol.getText()}", line=${symbol.symbol?.line}, column=${symbol.symbol?.column}, uri="${document.uri}"`);
    this.references.push(new TerminalSymbolReference(symbol, document));
  }
}
