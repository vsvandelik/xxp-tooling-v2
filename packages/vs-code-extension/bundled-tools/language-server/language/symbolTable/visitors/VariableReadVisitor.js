import { DataSymbol } from '../../../core/models/symbols/DataSymbol.js';
import { TaskSymbol } from '../../../core/models/symbols/TaskSymbol.js';
import { TerminalSymbolWithReferences } from '../../../core/models/symbols/TerminalSymbolWithReferences.js';
import { addDiagnosticAndContinue } from '../helpers/Diagnostics.js';
import { WorkflowSymbol } from '../../../core/models/symbols/WorkflowSymbol.js';
export class VariableReadVisitor {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    visitWorkflow(ctx) {
        if (ctx.IDENTIFIER() === null)
            return this.builder.visitChildren(ctx);
        return this.visitSymbolRead(WorkflowSymbol, ctx, 'Workflow');
    }
    visitData(ctx) {
        if (ctx.IDENTIFIER() === null)
            return this.builder.visitChildren(ctx);
        return this.visitSymbolRead(DataSymbol, ctx, 'Data variable');
    }
    visitTask(ctx) {
        if (ctx.IDENTIFIER() === null)
            return this.builder.visitChildren(ctx);
        return this.visitSymbolRead(TaskSymbol, ctx, 'Task variable');
    }
    visitSymbolRead(type, ctx, prefix) {
        const identifierText = ctx.IDENTIFIER().getText();
        const symbol = this.builder.currentScope.resolveSync(identifierText);
        if (symbol === null || symbol === undefined || !(symbol instanceof type)) {
            return addDiagnosticAndContinue(this.builder, ctx, `${prefix} '${identifierText}' is not defined`);
        }
        const matchedSymbol = symbol;
        if (matchedSymbol instanceof TerminalSymbolWithReferences) {
            matchedSymbol.addReference(ctx.IDENTIFIER(), this.builder.document);
        }
        else if (matchedSymbol instanceof WorkflowSymbol) {
            matchedSymbol.addReference(ctx.IDENTIFIER(), this.builder.document);
        }
        return this.builder.visitChildren(ctx);
    }
}
//# sourceMappingURL=VariableReadVisitor.js.map