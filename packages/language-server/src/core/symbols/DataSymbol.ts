import { BaseSymbol } from 'antlr4-c3';
import { Document } from '../documents/Document.js';
import { ParserRuleContext } from 'antlr4ng';

interface DataReference {
  node: ParserRuleContext;
  document: Document;
}

export class DataSymbol extends BaseSymbol {
  public references: DataReference[] = [];
  public value?: string;
  declare public context?: ParserRuleContext;

  constructor(
    name: string,
    public document: Document,
    context?: ParserRuleContext
  ) {
    super(name);
    this.context = context;
  }

  public addReference(node: ParserRuleContext, document: Document): void {
    this.references.push({ node, document });
  }
}
