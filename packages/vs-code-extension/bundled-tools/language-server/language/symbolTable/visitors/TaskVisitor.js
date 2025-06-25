import { TaskConfigurationScopeSymbol } from '../../../core/models/symbols/TaskConfigurationScopeSymbol.js';
import { TaskSymbol } from '../../../core/models/symbols/TaskSymbol.js';
import { addSymbolOfTypeWithInheritanceCheck, visitScopeSymbol } from '../helpers/SymbolHelpers.js';
import { addDiagnostic } from '../helpers/Diagnostics.js';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { Param } from '../../../core/models/Param.js';
export class TaskVisitor {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    visitDefinition(ctx) {
        const identifier = ctx.IDENTIFIER();
        if (!identifier) {
            return this.builder.visitChildren(ctx);
        }
        const taskName = identifier.getText();
        if (!taskName)
            return this.builder.defaultResult();
        const taskSymbol = addSymbolOfTypeWithInheritanceCheck(this.builder, TaskSymbol, taskName, ctx, 'task', this.builder.currentScope, this.builder.document);
        if (!taskSymbol)
            return this.builder.defaultResult();
        return this.builder.visitChildren(ctx);
    }
    visitConfiguration(ctx) {
        const nameContext = ctx.taskConfigurationHeader()?.taskNameRead();
        if (!nameContext) {
            return this.builder.visitChildren(ctx);
        }
        const taskName = nameContext.getText();
        const taskSymbol = this.getTaskSymbolByName(taskName);
        if (!taskSymbol) {
            return this.builder.visitChildren(ctx);
        }
        this.builder.visitChildren(ctx.taskConfigurationHeader());
        if (taskName === 'START' || taskName === 'END') {
            addDiagnostic(this.builder, nameContext, `Cannot configure reserved task '${taskName}'. START and END tasks are predefined and cannot be configured.`, DiagnosticSeverity.Error);
            return this.builder.visitChildren(ctx);
        }
        return visitScopeSymbol(this.builder, TaskConfigurationScopeSymbol, ctx.taskConfigurationBody(), taskSymbol);
    }
    visitImplementation(ctx) {
        const fileContext = ctx.fileNameString();
        if (!fileContext) {
            return this.builder.visitChildren(ctx);
        }
        const taskSymbol = this.getTaskSymbolFromCurrentScope();
        if (!taskSymbol) {
            return this.builder.visitChildren(ctx);
        }
        taskSymbol.implementation = fileContext.getText();
        return this.builder.visitChildren(ctx);
    }
    visitParam(ctx) {
        const identifier = ctx.IDENTIFIER();
        if (!identifier) {
            return this.builder.visitChildren(ctx);
        }
        const taskSymbol = this.getTaskSymbolFromCurrentScope();
        if (!taskSymbol) {
            return this.builder.visitChildren(ctx);
        }
        const paramName = identifier.getText();
        const hasValue = ctx.expression() !== undefined;
        taskSymbol.params.push(new Param(paramName, hasValue));
        return this.builder.visitChildren(ctx);
    }
    visitInput(ctx) {
        const taskSymbol = this.getTaskSymbolFromCurrentScope();
        if (!taskSymbol) {
            return this.builder.visitChildren(ctx);
        }
        const dataIdentifiers = ctx.dataNameList()?.dataNameRead();
        if (!dataIdentifiers || dataIdentifiers.length === 0) {
            return this.builder.visitChildren(ctx);
        }
        for (const dataIdentifier of dataIdentifiers) {
            const dataName = dataIdentifier.getText();
            if (!dataName)
                continue;
            taskSymbol.inputData.push(dataName);
        }
        return this.builder.visitChildren(ctx);
    }
    visitOutput(ctx) {
        const taskSymbol = this.getTaskSymbolFromCurrentScope();
        if (!taskSymbol) {
            return this.builder.visitChildren(ctx);
        }
        const dataIdentifiers = ctx.dataNameList()?.dataNameRead();
        if (!dataIdentifiers || dataIdentifiers.length === 0) {
            return this.builder.visitChildren(ctx);
        }
        for (const dataIdentifier of dataIdentifiers) {
            const dataName = dataIdentifier.getText();
            if (!dataName)
                continue;
            taskSymbol.outputData.push(dataName);
        }
        return this.builder.visitChildren(ctx);
    }
    getTaskSymbolByName(taskName) {
        const symbols = (this.builder.currentScope?.getNestedSymbolsOfTypeSync(TaskSymbol) ?? []).filter(symbol => symbol.name === taskName);
        return symbols.length === 1 ? symbols[0] : undefined;
    }
    getTaskSymbolFromCurrentScope() {
        if (!(this.builder.currentScope instanceof TaskConfigurationScopeSymbol) ||
            !this.builder.currentScope.symbolReference) {
            return undefined;
        }
        return this.builder.currentScope.symbolReference;
    }
}
//# sourceMappingURL=TaskVisitor.js.map