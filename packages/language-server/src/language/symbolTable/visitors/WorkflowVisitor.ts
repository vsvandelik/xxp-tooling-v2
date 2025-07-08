import {
  XxpWorkflowHeaderContext,
  XxpWorkflowBodyContext,
  XxpWorkflowNameReadContext,
} from '@extremexp/core';
import { TerminalNode } from 'antlr4ng';

import { Document } from '../../../core/documents/Document.js';
import { WorkflowSymbol } from '../../../core/models/symbols/WorkflowSymbol.js';
import { FileUtils } from '../../../utils/FileUtils.js';
import { XxpSymbolTableBuilder } from '../builders/XxpSymbolTableBuilder.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addDiagnostic, addDiagnosticForTerminalNode } from '../helpers/Diagnostics.js';
import { addSymbolOfTypeWithContext } from '../helpers/SymbolHelpers.js';

export class WorkflowVisitor {
  constructor(private readonly builder: XxpSymbolTableBuilder) {}

  public visitHeader(ctx: XxpWorkflowHeaderContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    if (!identifier) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    this.verifyWorkflowNameFileNameMatch(identifier);

    const workflowName = identifier.getText();
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
      return this.builder.defaultResult();
    }

    try {
      this.linkParentWorkflowSymbol(ctx, workflowSymbol);
      this.builder.visitChildren(ctx) as DocumentSymbolTable;
    } catch (error) {
      addDiagnostic(this.builder, ctx, `Error linking parent workflow: ${error}`);
    }
    this.builder.currentScope = workflowSymbol;

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
    if (parentContext) {
      const parentWorkflowDocument = this.getParentWorkflowDocument(parentContext);
      if (!parentWorkflowDocument) {
        addDiagnostic(
          this.builder,
          parentContext,
          `Parent workflow '${parentContext.getText()}' not found`
        );
      } else {
        const parentSymbol = parentWorkflowDocument.symbolTable?.resolveSync(
          parentContext.getText()
        ) as WorkflowSymbol;
        workflowSymbol.parentWorkflowSymbol = parentSymbol;
        Document.addDocumentDependency(this.builder.document, parentWorkflowDocument);
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
