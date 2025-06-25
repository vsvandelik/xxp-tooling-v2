import { TaskSymbol } from '../../../core/models/symbols/TaskSymbol.js';
import { SpaceSymbol } from '../../../core/models/symbols/SpaceSymbol.js';
import { WorkflowSymbol } from '../../../core/models/symbols/WorkflowSymbol.js';
import { TerminalSymbolWithReferences } from '../../../core/models/symbols/TerminalSymbolWithReferences.js';
import { addDiagnosticAndContinue } from '../helpers/Diagnostics.js';
import { EspaceTaskNameReadContext, } from '@extremexp/core';
export class EspaceVariableReadVisitor {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    visitWorkflow(ctx) {
        const identifier = ctx.IDENTIFIER();
        if (!identifier)
            return this.builder.visitChildren(ctx);
        const workflowName = identifier.getText();
        const folderSymbolTable = this.builder.documentsManager.getDocumentSymbolTableForFile(this.builder.document.uri);
        if (folderSymbolTable) {
            const workflowSymbol = folderSymbolTable.resolveSync(workflowName);
            if (workflowSymbol) {
                workflowSymbol.addReference(identifier, this.builder.document);
            }
        }
        return this.builder.visitChildren(ctx);
    }
    visitTask(ctx) {
        const identifier = ctx.IDENTIFIER();
        if (!identifier)
            return this.builder.visitChildren(ctx);
        return this.visitSymbolRead(TaskSymbol, ctx, 'Task');
    }
    visitSpace(ctx) {
        const identifier = ctx.IDENTIFIER();
        if (!identifier)
            return this.builder.visitChildren(ctx);
        const spaceName = identifier.getText();
        if (spaceName === 'START' || spaceName === 'END') {
            return this.builder.visitChildren(ctx);
        }
        return this.visitSymbolRead(SpaceSymbol, ctx, 'Space');
    }
    visitSymbolRead(type, ctx, prefix) {
        const identifier = ctx.IDENTIFIER();
        if (!identifier)
            return this.builder.visitChildren(ctx);
        const identifierText = identifier.getText();
        const symbol = this.builder.currentScope.resolveSync(identifierText);
        if (!symbol || !(symbol instanceof type)) {
            if (prefix === 'Task' && ctx instanceof EspaceTaskNameReadContext) {
                const workflowSymbol = this.getReferencedWorkflowSymbol();
                if (workflowSymbol) {
                    const workflowTask = workflowSymbol.resolveSync(identifierText);
                    if (workflowTask && workflowTask instanceof TaskSymbol) {
                        if (workflowTask instanceof TerminalSymbolWithReferences) {
                            workflowTask.addReference(identifier, this.builder.document);
                        }
                        return this.builder.visitChildren(ctx);
                    }
                }
            }
            return addDiagnosticAndContinue(this.builder, ctx, `${prefix} '${identifierText}' is not defined`);
        }
        const matchedSymbol = symbol;
        if (matchedSymbol instanceof TerminalSymbolWithReferences) {
            matchedSymbol.addReference(identifier, this.builder.document);
        }
        else if (matchedSymbol instanceof WorkflowSymbol) {
            matchedSymbol.addReference(identifier, this.builder.document);
        }
        return this.builder.visitChildren(ctx);
    }
    getReferencedWorkflowSymbol() {
        let scope = this.builder.currentScope;
        while (scope) {
            const spaces = scope.getNestedSymbolsOfTypeSync(SpaceSymbol);
            if (spaces.length > 0) {
                const space = spaces[0];
                return space.workflowReference;
            }
            scope = scope.parent;
        }
        return undefined;
    }
}
//# sourceMappingURL=EspaceVariableReadVisitor.js.map