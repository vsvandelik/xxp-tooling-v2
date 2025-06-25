import { TerminalSymbolWithReferences } from './TerminalSymbolWithReferences.js';
export class TaskSymbol extends TerminalSymbolWithReferences {
    implementation;
    params;
    inputData;
    outputData;
    constructor(name, document, implementation, params = [], inputData = [], outputData = []) {
        super(name, document);
        this.implementation = implementation;
        this.params = params;
        this.inputData = inputData;
        this.outputData = outputData;
    }
}
//# sourceMappingURL=TaskSymbol.js.map