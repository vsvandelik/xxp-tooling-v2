import { TerminalSymbolWithReferences } from './TerminalSymbolWithReferences.js';
export class SpaceSymbol extends TerminalSymbolWithReferences {
    workflowReference;
    strategy;
    constructor(name, document, workflowReference, strategy) {
        super(name, document);
        this.workflowReference = workflowReference;
        this.strategy = strategy;
    }
}
//# sourceMappingURL=SpaceSymbol.js.map