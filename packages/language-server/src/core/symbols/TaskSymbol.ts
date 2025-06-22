import { BaseSymbol } from 'antlr4-c3';
import { Document } from '../documents/Document.js';
import { ParserRuleContext } from 'antlr4ng';

interface TaskReference {
  node: ParserRuleContext;
  document: Document;
}

export class TaskSymbol extends BaseSymbol {
  public references: TaskReference[] = [];
  public implementation?: string;
  public params: string[] = [];
  public inputs: string[] = [];
  public outputs: string[] = [];
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
