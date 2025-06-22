import { BaseSymbol } from 'antlr4-c3';
import { Document } from '../documents/Document.js';
import { ParserRuleContext } from 'antlr4ng';

interface SpaceReference {
    node: ParserRuleContext;
    document: Document;
}

export class SpaceSymbol extends BaseSymbol {
    public references: SpaceReference[] = [];
    public strategy?: string;
    public params: Map<string, any> = new Map();
    public context?: ParserRuleContext;

    constructor(name: string, public workflowName: string, public document: Document) {
        super(name);
    }

    public addReference(node: ParserRuleContext, document: Document): void {
        this.references.push({ node, document });
    }
}