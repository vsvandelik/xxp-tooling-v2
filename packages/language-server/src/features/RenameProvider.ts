// packages/language-server/src/features/RenameProvider.ts
import {
  RenameParams,
  TextDocumentPositionParams,
  WorkspaceEdit,
  TextEdit,
  Range,
} from 'vscode-languageserver/node';
import { DocumentManager } from '../documents/DocumentManager.js';
import { ASTUtils } from '../utils/ASTUtils.js';

export class RenameProvider {
  constructor(private documentManager: DocumentManager) {}

  async prepareRename(
    params: TextDocumentPositionParams
  ): Promise<{ range: Range; placeholder: string } | null> {
    const document = this.documentManager.getDocument(params.textDocument.uri);
    if (!document || !document.parseTree) return null;

    const position = params.position;
    const node = this.documentManager.getNodeAtPosition(
      params.textDocument.uri,
      position.line,
      position.character
    );

    if (!node) return null;

    // Check if this is a renameable symbol
    const symbolInfo = ASTUtils.getSymbolInfo(node, document.languageId);
    if (!symbolInfo || !this.canRename(symbolInfo)) {
      return null;
    }

    return {
      range: symbolInfo.range,
      placeholder: symbolInfo.name,
    };
  }

  async provideRename(params: RenameParams): Promise<WorkspaceEdit | null> {
    const document = this.documentManager.getDocument(params.textDocument.uri);
    if (!document || !document.parseTree) return null;

    const position = params.position;
    const newName = params.newName;

    // Validate new name
    if (!this.isValidName(newName)) {
      throw new Error(`Invalid name: ${newName}`);
    }

    const node = this.documentManager.getNodeAtPosition(
      params.textDocument.uri,
      position.line,
      position.character
    );

    if (!node) return null;

    const symbolInfo = ASTUtils.getSymbolInfo(node, document.languageId);
    if (!symbolInfo || !this.canRename(symbolInfo)) {
      return null;
    }

    // Find all references to rename
    const symbolTable = this.documentManager.getSymbolTable();
    const references = symbolTable.getReferences(symbolInfo.name, symbolInfo.type);

    // Create workspace edit
    const edit: WorkspaceEdit = {
      changes: {},
    };

    // Group edits by document URI
    const editsByUri = new Map<string, TextEdit[]>();

    for (const reference of references) {
      const uriEdits = editsByUri.get(reference.uri) || [];
      uriEdits.push({
        range: reference.range,
        newText: newName,
      });
      editsByUri.set(reference.uri, uriEdits);
    }

    // Convert to workspace edit format
    for (const [uri, edits] of editsByUri) {
      edit.changes![uri] = edits;
    }

    // Handle cascading renames for specific symbol types
    this.addCascadingRenames(symbolInfo, newName, edit);

    return edit;
  }

  private canRename(symbolInfo: any): boolean {
    // Some symbols should not be renamed
    const nonRenameableTypes = ['keyword', 'builtin'];
    if (nonRenameableTypes.includes(symbolInfo.type)) {
      return false;
    }

    // Special symbols like START and END cannot be renamed
    const specialSymbols = ['START', 'END'];
    if (specialSymbols.includes(symbolInfo.name)) {
      return false;
    }

    return true;
  }

  private isValidName(name: string): boolean {
    // Check if name follows identifier rules
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  }

  private addCascadingRenames(symbolInfo: any, newName: string, edit: WorkspaceEdit): void {
    // Handle special cases where renaming one symbol requires renaming others

    switch (symbolInfo.type) {
      case 'workflow':
        // When renaming a workflow, we might need to update file names
        // This would require file system operations
        this.addWorkflowFileRename(symbolInfo.name, newName, edit);
        break;

      case 'task':
        // When renaming a task, update any task-specific parameter references
        this.addTaskParameterRenames(symbolInfo, newName, edit);
        break;

      case 'data':
        // When renaming data, ensure all input/output references are updated
        this.addDataReferenceRenames(symbolInfo, newName, edit);
        break;
    }
  }

  private addWorkflowFileRename(oldName: string, newName: string, edit: WorkspaceEdit): void {
    // If the workflow name matches the file name, suggest renaming the file
    // This would be handled by documentChanges in the WorkspaceEdit
    // For now, we'll add a comment indicating this might be needed
    // In a real implementation, you'd add a file rename operation
  }

  private addTaskParameterRenames(symbolInfo: any, newName: string, edit: WorkspaceEdit): void {
    // In ESPACE files, task-specific parameters use the format task:param
    // We need to update these references when the task is renamed

    const documents = this.documentManager.getAllDocuments();

    for (const doc of documents) {
      if (doc.languageId !== 'espace' || !doc.analysis) continue;

      const experiment = doc.analysis.experiment;
      if (!experiment) continue;

      const edits: TextEdit[] = [];

      for (const space of experiment.spaces) {
        for (const taskConfig of space.taskConfigurations) {
          if (taskConfig.taskName === symbolInfo.name) {
            // Update the task configuration itself
            edits.push({
              range: taskConfig.taskNameRange,
              newText: newName,
            });
          }
        }

        // Update parameter references in the format task:param
        for (const param of space.parameters) {
          if (param.name.startsWith(`${symbolInfo.name}:`)) {
            const paramSuffix = param.name.substring(symbolInfo.name.length);
            edits.push({
              range: param.nameRange,
              newText: `${newName}${paramSuffix}`,
            });
          }
        }
      }

      if (edits.length > 0) {
        if (!edit.changes![doc.uri]) {
          edit.changes![doc.uri] = [];
        }
        edit.changes![doc.uri]!.push(...edits);
      }
    }
  }

  private addDataReferenceRenames(symbolInfo: any, newName: string, edit: WorkspaceEdit): void {
    // Data references appear in multiple contexts:
    // - Data definitions
    // - Task inputs/outputs
    // - Data value assignments
    // The base rename operation should handle most of these
    // This method is for any special cases that need additional handling
  }
}
