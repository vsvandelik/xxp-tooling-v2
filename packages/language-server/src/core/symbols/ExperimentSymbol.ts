import { SymbolTable } from 'antlr4-c3';
import { Document } from '../documents/Document.js';
import { ParserRuleContext } from 'antlr4ng';

interface ExperimentReference {
    node: ParserRuleContext;
    document: Document;
}

export class ExperimentSymbol extends SymbolTable {
    public references: ExperimentReference[] = [];
    public context?: ParserRuleContext;

    constructor(name: string, public document: Document) {
        super(name, { allowDuplicateSymbols: false });
    }

    public clear(): void {
        super.clear();
        this.references = [];
    }

    public addReference(node: ParserRuleContext, document: Document): void {
        this.references.push({ node, document });
    }
}