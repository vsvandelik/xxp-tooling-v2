import { TaskConfigurationScopeSymbol } from '../../../core/models/symbols/TaskConfigurationScopeSymbol.js';
import { TaskSymbol } from '../../../core/models/symbols/TaskSymbol.js';
import { visitScopeSymbol } from '../helpers/SymbolHelpers.js';
import { addDiagnostic } from '../helpers/Diagnostics.js';
import { SpaceScopeSymbol } from '../../../core/models/symbols/SpaceScopeSymbol.js';
import { SpaceSymbol } from '../../../core/models/symbols/SpaceSymbol.js';
export class EspaceTaskConfigurationVisitor {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    visitConfiguration(ctx) {
        const nameContext = ctx.taskConfigurationHeader()?.taskNameRead();
        if (!nameContext) {
            return this.builder.visitChildren(ctx);
        }
        const taskName = nameContext.getText();
        const taskSymbol = this.getTaskSymbolByName(taskName);
        if (!taskSymbol) {
            const workflowSymbol = this.getReferencedWorkflowSymbol();
            if (!workflowSymbol) {
                addDiagnostic(this.builder, nameContext, `Task '${taskName}' is not defined`);
                return this.builder.visitChildren(ctx);
            }
            const workflowTask = workflowSymbol.resolveSync(taskName);
            if (!workflowTask || !(workflowTask instanceof TaskSymbol)) {
                addDiagnostic(this.builder, nameContext, `Task '${taskName}' is not defined in the referenced workflow`);
                return this.builder.visitChildren(ctx);
            }
        }
        this.builder.visitChildren(ctx.taskConfigurationHeader());
        return visitScopeSymbol(this.builder, TaskConfigurationScopeSymbol, ctx.taskConfigurationBody(), taskSymbol);
    }
    visitParamAssignment(ctx) {
        const identifier = ctx.IDENTIFIER();
        const paramValue = ctx.paramValue();
        if (!identifier || !paramValue) {
            return this.builder.visitChildren(ctx);
        }
        return this.builder.visitChildren(ctx);
    }
    getTaskSymbolByName(taskName) {
        const symbols = (this.builder.currentScope?.getNestedSymbolsOfTypeSync(TaskSymbol) ?? []).filter(symbol => symbol.name === taskName);
        return symbols.length === 1 ? symbols[0] : undefined;
    }
    getReferencedWorkflowSymbol() {
        let scope = this.builder.currentScope;
        while (scope && !(scope instanceof SpaceScopeSymbol)) {
            scope = scope.parent;
        }
        if (scope instanceof SpaceScopeSymbol && scope.symbolReference instanceof SpaceSymbol) {
            return scope.symbolReference.workflowReference;
        }
        return undefined;
    }
}
//# sourceMappingURL=EspaceTaskConfigurationVisitor.js.map