/*import { TaskSymbol } from '../../../core/models/symbols/TaskSymbol';
import { WorkflowSymbol } from '../../../core/models/symbols/WorkflowSymbol';
import { FileUtils } from '../../../utils/FileUtils';
import { DocumentSymbolTable } from '../DocumentSymbolTable';
import { addDiagnostic, addDiagnosticForTerminalNode } from '../helpers/Diagnostics';
import { addSymbolOfTypeWithContext } from '../helpers/SymbolHelpers';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder';
import { Document } from '../../../core/documents/Document';
import { TerminalNode } from 'antlr4ng';
import { WorkflowHeaderContext, WorkflowBodyContext, WorkflowNameReadContext } from '@extremexp/core/src/language/generated/XXPParser';

export class WorkflowVisitor {
	constructor(private readonly builder: XxpSymbolTableBuilder) { }

	public visitHeader(ctx: WorkflowHeaderContext): DocumentSymbolTable {
		const identifier = ctx.IDENTIFIER();
		if (!identifier) {
			return this.builder.visitChildren(ctx) as DocumentSymbolTable;
		}

		this.verifyWorkflowNameFileNameMatch(identifier);

		const workflowName = identifier.getText();
		const workflowSymbol = this.getExistingWorkflowSymbolTable(workflowName) || addSymbolOfTypeWithContext(
			this.builder,
			WorkflowSymbol,
			workflowName,
			ctx.parent!,
			this.builder.currentScope,
			this.builder.document
		);
		if (!workflowSymbol) {
			return this.builder.defaultResult();
		}

		try {
			this.linkParentWorkflowSymbol(ctx, workflowSymbol);
			this.builder.visitChildren(ctx) as DocumentSymbolTable;
		}
		catch (error) {
			addDiagnostic(this.builder, ctx, `Error linking parent workflow: ${error}`);
		}
		this.builder.currentScope = workflowSymbol;

		return this.builder.defaultResult();
	}

	public visitBody(ctx: WorkflowBodyContext): DocumentSymbolTable {
		if (!this.hasParentWorkflowSymbol()) {
			this.addWorkflowGlobalSymbols(ctx);
		}
		return this.builder.visitChildren(ctx) as DocumentSymbolTable;
	}

	private getExistingWorkflowSymbolTable(workflowName: string): WorkflowSymbol | undefined {
		if (!(this.builder.currentScope instanceof DocumentSymbolTable)) {
			throw new Error('Current scope is not a DocumentSymbolTable');
		}

		const existingWorkflowSymbolRaw = this.builder.symbolTable.children.find(c => c instanceof WorkflowSymbol && c.name === workflowName);
		if (!existingWorkflowSymbolRaw) return; // workflow with given name not found

		const existingWorkflowSymbol = existingWorkflowSymbolRaw as WorkflowSymbol;
		if (existingWorkflowSymbol.document.uri === this.builder.document.uri) {
			existingWorkflowSymbol.clear();
			return existingWorkflowSymbol;
		}

		return undefined;
	}

	private linkParentWorkflowSymbol(ctx: WorkflowHeaderContext, workflowSymbol: WorkflowSymbol): void {
		const parentContext = ctx.workflowNameRead();
		if (parentContext) {
			const parentWorkflowDocument = this.getParentWorkflowDocument(parentContext);
			if (!parentWorkflowDocument) {
				addDiagnostic(this.builder, parentContext, `Parent workflow '${parentContext.getText()}' not found`);
			}
			else {
				workflowSymbol.parentWorkflowSymbol = parentWorkflowDocument.symbolTable?.resolveSync(parentContext.getText()) as WorkflowSymbol;
				Document.addDocumentDependency(this.builder.document, parentWorkflowDocument);
			}
		}
	}

	private getParentWorkflowDocument(parentContext: WorkflowNameReadContext): Document | undefined {
		const parentName = parentContext.getText();
		const parentFileName = FileUtils.getWorkflowFileFromWorkflowName(parentName);
		const parentUri = this.builder.document.uri.replace(/[^/\\]+$/, parentFileName);
		const parentDocument = this.builder.documentsManager.getDocumentAndLoadIfNecessary(parentUri);

		return parentDocument;
	}

	private verifyWorkflowNameFileNameMatch(workflowNameIdentifier: TerminalNode): void {
		const workflowName = workflowNameIdentifier.getText();

		const expectedFileName = FileUtils.getWorkflowFileFromWorkflowName(workflowName);
		const actualFileName = FileUtils.getFileName(this.builder.document.uri);

		if (expectedFileName !== actualFileName) {
			addDiagnosticForTerminalNode(this.builder, workflowNameIdentifier, `Workflow name '${workflowName}' does not match file name '${actualFileName}'. Expected '${expectedFileName}'.`);
		}
	}

	private hasParentWorkflowSymbol(): boolean {
		return this.builder.currentScope instanceof WorkflowSymbol && !!this.builder.currentScope.parentWorkflowSymbol;
	}

	private addWorkflowGlobalSymbols(ctx: WorkflowBodyContext): void {
		addSymbolOfTypeWithContext(this.builder, TaskSymbol, 'START', ctx, this.builder.currentScope);
		addSymbolOfTypeWithContext(this.builder, TaskSymbol, 'END', ctx, this.builder.currentScope);
	}
}*/

import { XxpSymbolTableBuilder } from "../builders/XxpSymbolTableBuilder";

export class WorkflowVisitor {
	constructor(private readonly builder: XxpSymbolTableBuilder) {}
}