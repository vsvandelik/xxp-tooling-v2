import { WorkflowSymbol } from '../../../core/models/symbols/WorkflowSymbol.js';
import { FileUtils } from '../../../utils/FileUtils.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addDiagnostic, addDiagnosticForTerminalNode } from '../helpers/Diagnostics.js';
import { addSymbolOfTypeWithContext } from '../helpers/SymbolHelpers.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import { Document } from '../../../core/documents/Document.js';
import { TerminalNode } from 'antlr4ng';
import {
  XxpWorkflowHeaderContext,
  XxpWorkflowBodyContext,
  XxpWorkflowNameReadContext,
} from '@extremexp/core';

export class WorkflowVisitor {
  constructor(private readonly builder: XxpSymbolTableBuilder) {}

  public visitHeader(ctx: XxpWorkflowHeaderContext): DocumentSymbolTable {
    console.error(`[VISITOR] WorkflowVisitor.visitHeader: ${ctx.getText()}`);
    const identifier = ctx.IDENTIFIER();
    if (!identifier) {
      console.error(`[VISITOR] WorkflowVisitor.visitHeader: No identifier found`);
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    this.verifyWorkflowNameFileNameMatch(identifier);

    const workflowName = identifier.getText();
    console.error(`[VISITOR] WorkflowVisitor.visitHeader: Creating workflow symbol "${workflowName}"`);
    const workflowSymbol =
      this.getExistingWorkflowSymbolTable(workflowName) ||
      addSymbolOfTypeWithContext(
        this.builder,
        WorkflowSymbol,
        workflowName,
        ctx.parent!,
        this.builder.currentScope,
        this.builder.document
      );
    if (!workflowSymbol) {
      console.error(`[VISITOR] WorkflowVisitor.visitHeader: Failed to create workflow symbol`);
      return this.builder.defaultResult();
    }

    console.error(`[VISITOR] WorkflowVisitor.visitHeader: Created workflow symbol "${workflowName}"`);
    try {
      this.linkParentWorkflowSymbol(ctx, workflowSymbol);
      this.builder.visitChildren(ctx) as DocumentSymbolTable;
    } catch (error) {
      console.error(`[VISITOR] WorkflowVisitor.visitHeader: Error linking parent workflow: ${error}`);
      addDiagnostic(this.builder, ctx, `Error linking parent workflow: ${error}`);
    }
    this.builder.currentScope = workflowSymbol;
    console.error(`[VISITOR] WorkflowVisitor.visitHeader: Set current scope to "${workflowName}"`);

    return this.builder.defaultResult();
  }

  public visitBody(ctx: XxpWorkflowBodyContext): DocumentSymbolTable {
    return this.builder.visitChildren(ctx) as DocumentSymbolTable;

    /* TODO: check if the task chains exists */
  }

  private getExistingWorkflowSymbolTable(workflowName: string): WorkflowSymbol | undefined {
    if (!(this.builder.currentScope instanceof DocumentSymbolTable)) {
      throw new Error('Current scope is not a DocumentSymbolTable');
    }

    const existingWorkflowSymbolRaw = this.builder.symbolTable.children.find(
      c => c instanceof WorkflowSymbol && c.name === workflowName
    );
    if (!existingWorkflowSymbolRaw) return; // workflow with given name not found

    const existingWorkflowSymbol = existingWorkflowSymbolRaw as WorkflowSymbol;
    if (existingWorkflowSymbol.document.uri === this.builder.document.uri) {
      existingWorkflowSymbol.clear();
      return existingWorkflowSymbol;
    }

    return undefined;
  }

  private linkParentWorkflowSymbol(
    ctx: XxpWorkflowHeaderContext,
    workflowSymbol: WorkflowSymbol
  ): void {
    const parentContext = ctx.workflowNameRead();
    console.error(`[VISITOR] WorkflowVisitor.linkParentWorkflowSymbol: parentContext=${parentContext ? parentContext.getText() : 'null'}`);
    if (parentContext) {
      const parentWorkflowDocument = this.getParentWorkflowDocument(parentContext);
      console.error(`[VISITOR] WorkflowVisitor.linkParentWorkflowSymbol: parentWorkflowDocument found=${!!parentWorkflowDocument}`);
      if (!parentWorkflowDocument) {
        console.error(`[VISITOR] WorkflowVisitor.linkParentWorkflowSymbol: Parent workflow '${parentContext.getText()}' not found`);
        addDiagnostic(
          this.builder,
          parentContext,
          `Parent workflow '${parentContext.getText()}' not found`
        );
      } else {
        const parentSymbol = parentWorkflowDocument.symbolTable?.resolveSync(
          parentContext.getText()
        ) as WorkflowSymbol;
        console.error(`[VISITOR] WorkflowVisitor.linkParentWorkflowSymbol: Resolved parent symbol=${parentSymbol ? parentSymbol.name : 'null'}`);
        workflowSymbol.parentWorkflowSymbol = parentSymbol;
        Document.addDocumentDependency(this.builder.document, parentWorkflowDocument);
        console.error(`[VISITOR] WorkflowVisitor.linkParentWorkflowSymbol: Linked "${workflowSymbol.name}" to parent "${parentSymbol?.name}"`);
      }
    }
  }

  private getParentWorkflowDocument(
    parentContext: XxpWorkflowNameReadContext
  ): Document | undefined {
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
      addDiagnosticForTerminalNode(
        this.builder,
        workflowNameIdentifier,
        `Workflow name '${workflowName}' does not match file name '${actualFileName}'. Expected '${expectedFileName}'.`
      );
    }
  }
}
