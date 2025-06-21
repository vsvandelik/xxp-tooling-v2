// packages/language-server/src/features/CompletionProvider.ts
import {
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  InsertTextFormat,
  CompletionItemTag,
} from 'vscode-languageserver/node';
import { DocumentManager } from '../documents/DocumentManager.js';
import { CompletionEngine } from '../completion/CompletionEngine.js';
import { XXPCompletions } from '../completion/XXPCompletions.js';
import { ESPACECompletions } from '../completion/ESPACECompletions.js';

export class CompletionProvider {
  private completionEngine: CompletionEngine;
  private xxpCompletions: XXPCompletions;
  private espaceCompletions: ESPACECompletions;

  constructor(private documentManager: DocumentManager) {
    this.completionEngine = new CompletionEngine(documentManager);
    this.xxpCompletions = new XXPCompletions(documentManager);
    this.espaceCompletions = new ESPACECompletions(documentManager);
  }

  async provideCompletions(params: TextDocumentPositionParams): Promise<CompletionItem[]> {
    const document = this.documentManager.getDocument(params.textDocument.uri);
    if (!document) return [];

    const position = params.position;
    const context = this.completionEngine.analyzeContext(
      document,
      position.line,
      position.character
    );

    let items: CompletionItem[] = [];

    // Get language-specific completions
    if (document.languageId === 'xxp') {
      items = await this.xxpCompletions.getCompletions(context);
    } else if (document.languageId === 'espace') {
      items = await this.espaceCompletions.getCompletions(context);
    }

    // Add common completions
    items.push(...this.getCommonCompletions(context));

    // Filter and sort completions
    return this.filterAndSortCompletions(items, context);
  }

  async resolveCompletion(item: CompletionItem): Promise<CompletionItem> {
    // Add additional information to the completion item
    if (item.data) {
      switch (item.data.type) {
        case 'workflow':
          item.documentation = {
            kind: 'markdown',
            value: this.getWorkflowDocumentation(item.data.name),
          };
          break;
        case 'task':
          item.documentation = {
            kind: 'markdown',
            value: this.getTaskDocumentation(item.data.name, item.data.workflow),
          };
          break;
        case 'parameter':
          item.documentation = {
            kind: 'markdown',
            value: this.getParameterDocumentation(item.data.name, item.data.task),
          };
          break;
      }
    }

    return item;
  }

  private getCommonCompletions(context: any): CompletionItem[] {
    const items: CompletionItem[] = [];

    // Add snippet completions based on context
    if (context.isTopLevel) {
      // Common top-level snippets
      items.push({
        label: 'comment',
        kind: CompletionItemKind.Snippet,
        insertText: '// ${1:comment}',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Insert a comment',
      });
    }

    // Add keyword completions based on context
    if (context.expectsKeyword) {
      items.push(...this.getKeywordCompletions(context));
    }

    // Add symbol reference completions
    if (context.expectsReference) {
      items.push(...this.getSymbolCompletions(context));
    }

    return items;
  }

  private getKeywordCompletions(context: any): CompletionItem[] {
    const items: CompletionItem[] = [];
    const keywords = context.possibleKeywords || [];

    for (const keyword of keywords) {
      items.push({
        label: keyword,
        kind: CompletionItemKind.Keyword,
        insertText: keyword,
        documentation: this.getKeywordDocumentation(keyword),
        sortText: `1_${keyword}`, // Keywords come first
      });
    }

    return items;
  }

  private getSymbolCompletions(context: any): CompletionItem[] {
    const items: CompletionItem[] = [];
    const symbolTable = this.documentManager.getSymbolTable();

    switch (context.expectedType) {
      case 'workflow':
        const workflows = symbolTable.getAllSymbols('workflow');
        for (const workflow of workflows) {
          items.push({
            label: workflow.name,
            kind: CompletionItemKind.Class,
            insertText: workflow.name,
            detail: 'workflow',
            documentation: workflow.documentation,
            data: { type: 'workflow', name: workflow.name },
            sortText: `2_${workflow.name}`,
          });
        }
        break;

      case 'task':
        if (context.workflow) {
          const tasks = symbolTable.getWorkflowTasks(context.workflow);
          for (const task of tasks) {
            items.push({
              label: task.name,
              kind: CompletionItemKind.Function,
              insertText: task.name,
              detail: `task in ${context.workflow}`,
              documentation: task.documentation,
              data: { type: 'task', name: task.name, workflow: context.workflow },
              sortText: `2_${task.name}`,
            });
          }
        }
        break;

      case 'parameter':
        if (context.task) {
          const params = symbolTable.getTaskParameters(context.task);
          for (const param of params) {
            items.push({
              label: param.name,
              kind: CompletionItemKind.Variable,
              insertText: param.name,
              detail: param.type ? `${param.type} parameter` : 'parameter',
              documentation: param.documentation,
              data: { type: 'parameter', name: param.name, task: context.task },
              sortText: `2_${param.name}`,
            });
          }
        }
        break;

      case 'data':
        const dataItems = symbolTable.getAllSymbols('data');
        for (const data of dataItems) {
          items.push({
            label: data.name,
            kind: CompletionItemKind.Variable,
            insertText: data.name,
            detail: 'data',
            documentation: data.documentation,
            data: { type: 'data', name: data.name },
            sortText: `2_${data.name}`,
          });
        }
        break;

      case 'space':
        if (context.experiment) {
          const spaces = symbolTable.getExperimentSpaces(context.experiment);
          for (const space of spaces) {
            items.push({
              label: space.name,
              kind: CompletionItemKind.Module,
              insertText: space.name,
              detail: `space in ${context.experiment}`,
              documentation: space.documentation,
              data: { type: 'space', name: space.name, experiment: context.experiment },
              sortText: `2_${space.name}`,
            });
          }
        }
        break;
    }

    return items;
  }

  private filterAndSortCompletions(
    items: CompletionItem[],
    context: any
  ): CompletionItem[] {
    // Filter based on context
    let filtered = items;

    if (context.filter) {
      const filterLower = context.filter.toLowerCase();
      filtered = items.filter(item =>
        item.label.toLowerCase().includes(filterLower)
      );
    }

    // Remove duplicates
    const seen = new Set<string>();
    filtered = filtered.filter(item => {
      if (seen.has(item.label)) {
        return false;
      }
      seen.add(item.label);
      return true;
    });

    // Sort by relevance
    return filtered.sort((a, b) => {
      // First by sort text if provided
      if (a.sortText && b.sortText) {
        return a.sortText.localeCompare(b.sortText);
      }
      // Then by label
      return a.label.localeCompare(b.label);
    });
  }

  private getKeywordDocumentation(keyword: string): string {
    const docs: Record<string, string> = {
      workflow: 'Defines a new workflow',
      experiment: 'Defines a new experiment',
      task: 'Defines a task within a workflow',
      space: 'Defines a parameter space within an experiment',
      param: 'Defines a parameter',
      data: 'Defines a data item',
      implementation: 'Specifies the implementation file for a task',
      strategy: 'Specifies the search strategy for a space',
      control: 'Defines the control flow for an experiment',
      configure: 'Configures a task with parameters',
      input: 'Specifies input data for a task',
      output: 'Specifies output data for a task',
      from: 'Specifies inheritance relationship',
      enum: 'Creates an enumeration of values',
      range: 'Creates a range of numeric values',
    };

    return docs[keyword] || '';
  }

  private getWorkflowDocumentation(name: string): string {
    const symbolTable = this.documentManager.getSymbolTable();
    const workflow = symbolTable.getWorkflowInfo(name);
    
    if (!workflow) return '';

    let doc = `# Workflow: ${name}\n\n`;
    
    if (workflow.parentWorkflow) {
      doc += `**Inherits from:** ${workflow.parentWorkflow}\n\n`;
    }

    if (workflow.tasks.length > 0) {
      doc += `**Tasks:**\n`;
      for (const task of workflow.tasks) {
        doc += `- ${task.name}`;
        if (task.implementation) {
          doc += ` (${task.implementation})`;
        }
        doc += '\n';
      }
    }

    return doc;
  }

  private getTaskDocumentation(name: string, workflow: string): string {
    const symbolTable = this.documentManager.getSymbolTable();
    const task = symbolTable.getTaskInfo(workflow, name);
    
    if (!task) return '';

    let doc = `# Task: ${name}\n\n`;
    doc += `**Workflow:** ${workflow}\n\n`;

    if (task.implementation) {
      doc += `**Implementation:** ${task.implementation}\n\n`;
    }

    if (task.parameters.length > 0) {
      doc += `**Parameters:**\n`;
      for (const param of task.parameters) {
        doc += `- ${param.name}`;
        if (param.type) {
          doc += `: ${param.type}`;
        }
        if (param.required) {
          doc += ' (required)';
        }
        doc += '\n';
      }
    }

    if (task.inputs.length > 0) {
      doc += `\n**Inputs:** ${task.inputs.join(', ')}\n`;
    }

    if (task.outputs.length > 0) {
      doc += `**Outputs:** ${task.outputs.join(', ')}\n`;
    }

    return doc;
  }

  private getParameterDocumentation(name: string, task: string): string {
    const symbolTable = this.documentManager.getSymbolTable();
    const param = symbolTable.getParameterInfo(task, name);
    
    if (!param) return '';

    let doc = `# Parameter: ${name}\n\n`;
    doc += `**Task:** ${task}\n\n`;

    if (param.type) {
      doc += `**Type:** ${param.type}\n`;
    }

    if (param.defaultValue !== undefined) {
      doc += `**Default:** ${param.defaultValue}\n`;
    }

    if (param.required) {
      doc += `**Required:** Yes\n`;
    }

    return doc;
  }
}