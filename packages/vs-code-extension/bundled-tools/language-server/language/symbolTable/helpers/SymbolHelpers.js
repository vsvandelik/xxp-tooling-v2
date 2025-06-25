import { DuplicateSymbolError } from 'antlr4-c3';
import { addDiagnostic } from './Diagnostics.js';
import { WorkflowSymbol } from '../../../core/models/symbols/WorkflowSymbol.js';
export function addSymbolOfTypeWithContext(builder, type, name, ctx, scope = builder.currentScope, ...args) {
    try {
        const symbol = builder.symbolTable.addNewSymbolOfType(type, scope, name, ...args);
        symbol.context = ctx;
        return symbol;
    }
    catch (error) {
        if (error instanceof DuplicateSymbolError) {
            addDiagnostic(builder, ctx, `Duplicate name '${name}'`);
        }
    }
    return undefined;
}
export function addSymbolOfTypeWithInheritanceCheck(builder, type, name, ctx, symbolType, scope = builder.currentScope, ...args) {
    if (scope instanceof WorkflowSymbol && scope.parentWorkflowSymbol) {
        const parentSymbol = scope.parentWorkflowSymbol.resolveSync(name, true);
        if (parentSymbol && parentSymbol.name === name) {
            addDiagnostic(builder, ctx, `Cannot override ${symbolType} '${name}' from parent workflow`);
            return undefined;
        }
    }
    return addSymbolOfTypeWithContext(builder, type, name, ctx, scope, ...args);
}
export function visitScopeSymbol(builder, type, ctx, symbolReference) {
    const originalScope = builder.currentScope;
    const scopeName = (originalScope.children.length ?? 0) + 1;
    const newScopeSymbol = addSymbolOfTypeWithContext(builder, type, scopeName.toString(), ctx, originalScope, symbolReference);
    if (!newScopeSymbol) {
        return builder.defaultResult();
    }
    builder.currentScope = newScopeSymbol;
    try {
        return builder.visitChildren(ctx);
    }
    finally {
        builder.currentScope = originalScope;
    }
}
//# sourceMappingURL=SymbolHelpers.js.map