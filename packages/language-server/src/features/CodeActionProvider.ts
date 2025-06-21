// packages/language-server/src/features/CodeActionProvider.ts
import {
  CodeActionParams,
  CodeAction,
  CodeActionKind,
  Command,
  TextEdit,
  WorkspaceEdit,
  Diagnostic,
} from 'vscode-languageserver/node';
import { DocumentManager } from '../documents/DocumentManager.js';

export class CodeActionProvider {
  constructor(private documentManager: DocumentManager) {}

  async provideCodeActions(params: CodeActionParams): Promise<CodeAction[] | null> {
    const document = this.documentManager.getDocument(params.textDocument.uri);
    if (!document) return null;

    const codeActions: CodeAction[] = [];
    const diagnostics = params.context.diagnostics;

    // Generate quick fixes for diagnostics
    for (const diagnostic of diagnostics) {
      const fixes = this.getQuickFixesForDiagnostic(diagnostic, params.textDocument.uri);
      codeActions.push(...fixes);
    }

    // Add refactoring actions if requested
    if (!params.context.only || params.context.only.includes(CodeActionKind.Refactor)) {
      const refactorings = this.getRefactoringActions(params);
      codeActions.push(...refactorings);
    }

    return codeActions.length > 0 ? codeActions : null;
  }

  private getQuickFixesForDiagnostic(diagnostic: Diagnostic, uri: string): CodeAction[] {
    const actions: CodeAction[] = [];

    // Handle different diagnostic codes
    switch (diagnostic.code) {
      case 'undefined-reference':
        actions.push(...this.getUndefinedReferenceFixe

(diagnostic, uri));
        break;
        
      case 'duplicate-definition':
        actions.push(...this.getDuplicateDefinitionFixes(diagnostic, uri));
        break;
        
      case 'unused-definition':
        actions.push(...this.getUnusedDefinitionFixes(diagnostic, uri));
        break;
        
      case 'naming-convention':
        actions.push(...this.getNamingConventionFixes(diagnostic, uri));
        break;
        
      case 'xxp-abstract-task':
        actions.push(...this.getAbstractTaskFixes(diagnostic, uri));
        break;
        
      case 'xxp-missing-task-chain':
        actions.push(...this.getMissingTaskChainFixes(diagnostic, uri));
        break;
        
      case 'espace-workflow-not-found':
        actions.push(...this.getWorkflowNotFoundFixes(diagnostic, uri));
        break;
        
      case 'espace-missing-parameter':
        actions.push(...this.getMissingParameterFixes(diagnostic, uri));
        break;
        
      case 'espace-missing-control-flow':
        actions.push(...this.getMissingControlFlowFixes(diagnostic, uri));
        break;
    }

    return actions;
  }

  private getUndefinedReferenceFixes(diagnostic: Diagnostic, uri: string): CodeAction[] {
    const actions: CodeAction[] = [];
    const data = diagnostic.data;
    
    if (!data) return actions;

    switch (data.type) {
      case 'workflow':
        // Offer to create the missing workflow
        actions.push({
          title: `Create workflow '${data.name}'`,
          kind: CodeActionKind.QuickFix,
          diagnostics: [diagnostic],
          command: {
            title: 'Create workflow',
            command: 'extremexp.quickfix.createMissingWorkflow',
            arguments: [data.name],
          },
        });
        break;
        
      case 'task':
        // Offer to define the missing task
        actions.push({
          title: `Define task '${data.name}'`,
          kind: CodeActionKind.QuickFix,
          diagnostics: [diagnostic],
          edit: this.createAddTaskEdit(uri, data.name, diagnostic.range),
        });
        break;
        
      case 'parameter':
        // Offer to add the missing parameter
        actions.push({
          title: `Add parameter '${data.name}'`,
          kind: CodeActionKind.QuickFix,
          diagnostics: [diagnostic],
          command: {
            title: 'Add parameter',
            command: 'extremexp.quickfix.addMissingParameter',
            arguments: [uri, data.name, diagnostic.range],
          },
        });
        break;
    }

    return actions;
  }

  private getDuplicateDefinitionFixes(diagnostic: Diagnostic, uri: string): CodeAction[] {
    const actions: CodeAction[] = [];

    // Offer to rename the duplicate
    actions.push({
      title: 'Rename this occurrence',
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      command: {
        title: 'Rename',
        command: 'editor.action.rename',
        arguments: [{
          line: diagnostic.range.start.line,
          character: diagnostic.range.start.character,
        }],
      },
    });

    // Offer to remove the duplicate
    actions.push({
      title: 'Remove this definition',
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      edit: {
        changes: {
          [uri]: [{
            range: diagnostic.range,
            newText: '',
          }],
        },
      },
    });

    return actions;
  }

  private getUnusedDefinitionFixes(diagnostic: Diagnostic, uri: string): CodeAction[] {
    const actions: CodeAction[] = [];

    // Offer to remove the unused definition
    actions.push({
      title: 'Remove unused definition',
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      command: {
        title: 'Remove',
        command: 'extremexp.quickfix.removeUnusedParameter',
        arguments: [uri, diagnostic.range],
      },
    });

    return actions;
  }

  private getNamingConventionFixes(diagnostic: Diagnostic, uri: string): CodeAction[] {
    const actions: CodeAction[] = [];
    const data = diagnostic.data;
    
    if (!data) return actions;

    // Generate properly formatted name
    const properName = this.formatName(data.name, data.expectedPattern);
    
    if (properName !== data.name) {
      actions.push({
        title: `Rename to '${properName}'`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit: {
          changes: {
            [uri]: [{
              range: diagnostic.range,
              newText: properName,
            }],
          },
        },
      });
    }

    return actions;
  }

  private getAbstractTaskFixes(diagnostic: Diagnostic, uri: string): CodeAction[] {
    const actions: CodeAction[] = [];
    const document = this.documentManager.getDocument(uri);
    
    if (!document) return actions;

    // Offer to add implementation
    actions.push({
      title: 'Add implementation',
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      edit: this.createAddImplementationEdit(uri, diagnostic),
    });

    return actions;
  }

  private getMissingTaskChainFixes(diagnostic: Diagnostic, uri: string): CodeAction[] {
    const actions: CodeAction[] = [];

    // Offer to add a basic task chain
    actions.push({
      title: 'Add task chain',
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      edit: this.createAddTaskChainEdit(uri, diagnostic),
    });

    return actions;
  }

  private getWorkflowNotFoundFixes(diagnostic: Diagnostic, uri: string): CodeAction[] {
    const actions: CodeAction[] = [];
    const data = diagnostic.data;
    
    if (!data) return actions;

    // Offer to create the workflow
    actions.push({
      title: `Create workflow '${data.name}'`,
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      command: {
        title: 'Create workflow',
        command: 'extremexp.quickfix.createMissingWorkflow',
        arguments: [data.name],
      },
    });

    return actions;
  }

  private getMissingParameterFixes(diagnostic: Diagnostic, uri: string): CodeAction[] {
    const actions: CodeAction[] = [];
    const data = diagnostic.data;
    
    if (!data) return actions;

    // Offer to add the parameter to the space
    actions.push({
      title: `Add parameter '${data.name}' to space`,
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      edit: this.createAddParameterToSpaceEdit(uri, data.name, diagnostic),
    });

    return actions;
  }

  private getMissingControlFlowFixes(diagnostic: Diagnostic, uri: string): CodeAction[] {
    const actions: CodeAction[] = [];

    // Offer to add basic control flow
    actions.push({
      title: 'Add control flow',
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      edit: this.createAddControlFlowEdit(uri, diagnostic),
    });

    return actions;
  }

  private getRefactoringActions(params: CodeActionParams): CodeAction[] {
    const actions: CodeAction[] = [];
    const document = this.documentManager.getDocument(params.textDocument.uri);
    
    if (!document) return actions;

    // Extract task refactoring
    if (this.canExtractTask(params)) {
      actions.push({
        title: 'Extract task',
        kind: CodeActionKind.RefactorExtract,
        command: {
          title: 'Extract task',
          command: 'extremexp.refactor.extractTask',
          arguments: [params.textDocument.uri, params.range],
        },
      });
    }

    // Extract parameter refactoring
    if (this.canExtractParameter(params)) {
      actions.push({
        title: 'Extract parameter',
        kind: CodeActionKind.RefactorExtract,
        command: {
          title: 'Extract parameter',
          command: 'extremexp.refactor.extractParameter',
          arguments: [params.textDocument.uri, params.range],
        },
      });
    }

    return actions;
  }

  private createAddTaskEdit(uri: string, taskName: string, range: any): WorkspaceEdit {
    // This is a simplified implementation
    // In reality, you'd need to find the appropriate location in the workflow
    const edit: WorkspaceEdit = {
      changes: {
        [uri]: [{
          range: { start: range.end, end: range.end },
          newText: `\n    define task ${taskName};`,
        }],
      },
    };
    return edit;
  }

  private createAddImplementationEdit(uri: string, diagnostic: Diagnostic): WorkspaceEdit {
    // Find the task configuration block and add implementation
    const edit: WorkspaceEdit = {
      changes: {
        [uri]: [{
          range: { start: diagnostic.range.end, end: diagnostic.range.end },
          newText: '\n        implementation "task.py";',
        }],
      },
    };
    return edit;
  }

  private createAddTaskChainEdit(uri: string, diagnostic: Diagnostic): WorkspaceEdit {
    const document = this.documentManager.getDocument(uri);
    if (!document || !document.analysis) {
      return { changes: {} };
    }

    // Get task names from the workflow
    const taskNames: string[] = [];
    if (document.analysis.workflow) {
      taskNames.push(...document.analysis.workflow.tasks.map(t => t.name));
    }

    const chainText = taskNames.length > 0
      ? `\n    START -> ${taskNames.join(' -> ')} -> END;`
      : '\n    START -> END;';

    const edit: WorkspaceEdit = {
      changes: {
        [uri]: [{
          range: { start: diagnostic.range.end, end: diagnostic.range.end },
          newText: chainText,
        }],
      },
    };
    return edit;
  }

  private createAddParameterToSpaceEdit(
    uri: string, 
    paramName: string, 
    diagnostic: Diagnostic
  ): WorkspaceEdit {
    // Add parameter definition to the space
    const edit: WorkspaceEdit = {
      changes: {
        [uri]: [{
          range: { start: diagnostic.range.end, end: diagnostic.range.end },
          newText: `\n    param ${paramName} = 0; // TODO: Set appropriate value`,
        }],
      },
    };
    return edit;
  }

  private createAddControlFlowEdit(uri: string, diagnostic: Diagnostic): WorkspaceEdit {
    const document = this.documentManager.getDocument(uri);
    if (!document || !document.analysis) {
      return { changes: {} };
    }

    // Get space names from the experiment
    const spaceNames: string[] = [];
    if (document.analysis.experiment) {
      spaceNames.push(...document.analysis.experiment.spaces.map(s => s.name));
    }

    const controlText = spaceNames.length > 0
      ? `\n\n    control {\n        START -> ${spaceNames.join(' -> ')} -> END;\n    }`
      : '\n\n    control {\n        START -> END;\n    }';

    const edit: WorkspaceEdit = {
      changes: {
        [uri]: [{
          range: { start: diagnostic.range.end, end: diagnostic.range.end },
          newText: controlText,
        }],
      },
    };
    return edit;
  }

  private formatName(name: string, pattern: string): string {
    switch (pattern) {
      case 'PascalCase (e.g., MyWorkflow)':
        return name.charAt(0).toUpperCase() + name.slice(1);
        
      case 'camelCase (e.g., myTask)':
        return name.charAt(0).toLowerCase() + name.slice(1);
        
      default:
        return name;
    }
  }

  private canExtractTask(params: CodeActionParams): boolean {
    // Check if the selection contains code that could be extracted into a task
    // This is a placeholder implementation
    return false;
  }

  private canExtractParameter(params: CodeActionParams): boolean {
    // Check if the selection contains a value that could be extracted as a parameter
    // This is a placeholder implementation
    return false;
  }
}