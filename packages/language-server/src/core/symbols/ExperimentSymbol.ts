import { SymbolTable } from 'antlr4-c3';
import { Document } from '../documents/Document.js';
import { ParserRuleContext } from 'antlr4ng';

interface ExperimentReference {
  node: ParserRuleContext;
  document: Document;
}

export class ExperimentSymbol extends SymbolTable {
  public references: ExperimentReference[] = [];
  declare public context?: ParserRuleContext;

  constructor(
    name: string,
    public document: Document,
    context?: ParserRuleContext
  ) {
    super(name, { allowDuplicateSymbols: false });
    this.context = context;
  }

  public override clear(): void {
    super.clear();
    this.references = [];
  }

  public addReference(node: ParserRuleContext, document: Document): void {
    this.references.push({ node, document });
  }
}
