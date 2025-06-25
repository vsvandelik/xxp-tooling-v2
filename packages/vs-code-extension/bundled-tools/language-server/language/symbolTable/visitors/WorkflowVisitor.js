import { WorkflowSymbol } from '../../../core/models/symbols/WorkflowSymbol.js';
import { FileUtils } from '../../../utils/FileUtils.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addDiagnostic, addDiagnosticForTerminalNode } from '../helpers/Diagnostics.js';
import { addSymbolOfTypeWithContext } from '../helpers/SymbolHelpers.js';
import { Document } from '../../../core/documents/Document.js';
export class WorkflowVisitor {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    visitHeader(ctx) {
        const identifier = ctx.IDENTIFIER();
        if (!identifier) {
            return this.builder.visitChildren(ctx);
        }
        this.verifyWorkflowNameFileNameMatch(identifier);
        const workflowName = identifier.getText();
        const workflowSymbol = this.getExistingWorkflowSymbolTable(workflowName) ||
            addSymbolOfTypeWithContext(this.builder, WorkflowSymbol, workflowName, ctx.parent, this.builder.currentScope, this.builder.document);
        if (!workflowSymbol) {
            return this.builder.defaultResult();
        }
        try {
            this.linkParentWorkflowSymbol(ctx, workflowSymbol);
            this.builder.visitChildren(ctx);
        }
        catch (error) {
            addDiagnostic(this.builder, ctx, `Error linking parent workflow: ${error}`);
        }
        this.builder.currentScope = workflowSymbol;
        return this.builder.defaultResult();
    }
    visitBody(ctx) {
        return this.builder.visitChildren(ctx);
    }
    getExistingWorkflowSymbolTable(workflowName) {
        if (!(this.builder.currentScope instanceof DocumentSymbolTable)) {
            throw new Error('Current scope is not a DocumentSymbolTable');
        }
        const existingWorkflowSymbolRaw = this.builder.symbolTable.children.find(c => c instanceof WorkflowSymbol && c.name === workflowName);
        if (!existingWorkflowSymbolRaw)
            return;
        const existingWorkflowSymbol = existingWorkflowSymbolRaw;
        if (existingWorkflowSymbol.document.uri === this.builder.document.uri) {
            existingWorkflowSymbol.clear();
            return existingWorkflowSymbol;
        }
        return undefined;
    }
    linkParentWorkflowSymbol(ctx, workflowSymbol) {
        const parentContext = ctx.workflowNameRead();
        if (parentContext) {
            const parentWorkflowDocument = this.getParentWorkflowDocument(parentContext);
            if (!parentWorkflowDocument) {
                addDiagnostic(this.builder, parentContext, `Parent workflow '${parentContext.getText()}' not found`);
            }
            else {
                workflowSymbol.parentWorkflowSymbol = parentWorkflowDocument.symbolTable?.resolveSync(parentContext.getText());
                Document.addDocumentDependency(this.builder.document, parentWorkflowDocument);
            }
        }
    }
    getParentWorkflowDocument(parentContext) {
        const parentName = parentContext.getText();
        const parentFileName = FileUtils.getWorkflowFileFromWorkflowName(parentName);
        const parentUri = this.builder.document.uri.replace(/[^/\\]+$/, parentFileName);
        const parentDocument = this.builder.documentsManager.getDocumentAndLoadIfNecessary(parentUri);
        return parentDocument;
    }
    verifyWorkflowNameFileNameMatch(workflowNameIdentifier) {
        const workflowName = workflowNameIdentifier.getText();
        const expectedFileName = FileUtils.getWorkflowFileFromWorkflowName(workflowName);
        const actualFileName = FileUtils.getFileName(this.builder.document.uri);
        if (expectedFileName !== actualFileName) {
            addDiagnosticForTerminalNode(this.builder, workflowNameIdentifier, `Workflow name '${workflowName}' does not match file name '${actualFileName}'. Expected '${expectedFileName}'.`);
        }
    }
}
//# sourceMappingURL=WorkflowVisitor.js.map