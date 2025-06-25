import { SpaceSymbol } from '../../../core/models/symbols/SpaceSymbol.js';
import { SpaceScopeSymbol } from '../../../core/models/symbols/SpaceScopeSymbol.js';
import { addSymbolOfTypeWithContext, visitScopeSymbol } from '../helpers/SymbolHelpers.js';
import { addDiagnostic } from '../helpers/Diagnostics.js';
import { FileUtils } from '../../../utils/FileUtils.js';
import { Document } from '../../../core/documents/Document.js';
export class EspaceSpaceVisitor {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    visitDeclaration(ctx) {
        const header = ctx.spaceHeader();
        const body = ctx.spaceBody();
        if (!header || !body) {
            return this.builder.visitChildren(ctx);
        }
        this.builder.visit(header);
        this.builder.visit(body);
        return this.builder.defaultResult();
    }
    visitHeader(ctx) {
        const identifier = ctx.IDENTIFIER();
        const workflowNameRead = ctx.workflowNameRead();
        if (!identifier || !workflowNameRead) {
            return this.builder.visitChildren(ctx);
        }
        const spaceName = identifier.getText();
        const workflowName = workflowNameRead.getText();
        const workflowDocument = this.getWorkflowDocument(workflowName);
        let workflowSymbol;
        if (!workflowDocument) {
            addDiagnostic(this.builder, workflowNameRead, `Workflow '${workflowName}' not found`);
        }
        else {
            workflowSymbol = workflowDocument.symbolTable?.resolveSync(workflowName);
            if (!workflowSymbol) {
                addDiagnostic(this.builder, workflowNameRead, `Workflow '${workflowName}' is not defined in the referenced file`);
            }
            else {
                Document.addDocumentDependency(this.builder.document, workflowDocument);
            }
        }
        const spaceSymbol = addSymbolOfTypeWithContext(this.builder, SpaceSymbol, spaceName, ctx, this.builder.currentScope, this.builder.document, workflowSymbol);
        if (!spaceSymbol) {
            return this.builder.defaultResult();
        }
        this.builder.visit(workflowNameRead);
        return this.builder.defaultResult();
    }
    visitBody(ctx) {
        const spaceSymbol = this.findSpaceSymbolForBody(ctx);
        if (!spaceSymbol) {
            return this.builder.visitChildren(ctx);
        }
        return visitScopeSymbol(this.builder, SpaceScopeSymbol, ctx, spaceSymbol);
    }
    visitStrategy(ctx) {
        const identifier = ctx.IDENTIFIER();
        if (!identifier) {
            return this.builder.visitChildren(ctx);
        }
        const strategyName = identifier.getText();
        const spaceScope = this.findParentSpaceScope();
        if (spaceScope && spaceScope.symbolReference instanceof SpaceSymbol) {
            spaceScope.symbolReference.strategy = strategyName;
        }
        return this.builder.visitChildren(ctx);
    }
    getWorkflowDocument(workflowName) {
        const workflowFileName = FileUtils.getWorkflowFileFromWorkflowName(workflowName);
        const workflowUri = this.builder.document.uri.replace(/[^/\\]+$/, workflowFileName);
        return this.builder.documentsManager.getDocumentAndLoadIfNecessary(workflowUri);
    }
    findSpaceSymbolForBody(ctx) {
        const declaration = ctx.parent;
        if (!declaration)
            return undefined;
        const spaces = this.builder.currentScope.getNestedSymbolsOfTypeSync(SpaceSymbol);
        return spaces[spaces.length - 1];
    }
    findParentSpaceScope() {
        if (this.builder.currentScope instanceof SpaceScopeSymbol) {
            return this.builder.currentScope;
        }
        return undefined;
    }
}
//# sourceMappingURL=EspaceSpaceVisitor.js.map