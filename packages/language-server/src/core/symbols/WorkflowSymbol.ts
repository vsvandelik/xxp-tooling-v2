import { SymbolTable } from 'antlr4-c3';
import { Document } from '../documents/Document.js';
import { ParserRuleContext } from 'antlr4ng';

interface WorkflowReference {
  node: ParserRuleContext;
  document: Document;
}

export class WorkflowSymbol extends SymbolTable {
  public parentWorkflow?: WorkflowSymbol;
  public references: WorkflowReference[] = [];
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
    this.parentWorkflow = undefined;
    this.references = [];

    // Clean up dependencies
    for (const dependency of this.document.dependencies) {
      dependency.dependents.delete(this.document);
    }
    this.document.dependencies.clear();
  }

  public addReference(node: ParserRuleContext, document: Document): void {
    this.references.push({ node, document });
  }
}
