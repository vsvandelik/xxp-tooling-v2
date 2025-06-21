// packages/language-server/src/completion/XXPCompletions.ts
import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
} from 'vscode-languageserver/node';
import { DocumentManager } from '../documents/DocumentManager.js';
import { CompletionContext } from './CompletionContext.js';

export class XXPCompletions {
  constructor(private documentManager: DocumentManager) {}

  async getCompletions(context: CompletionContext): Promise<CompletionItem[]> {
    const items: CompletionItem[] = [];

    // Add context-specific completions
    if (context.isInWorkflowBody) {
      items.push(...this.getWorkflowBodyCompletions(context));
    } else if (context.isInTaskConfiguration) {
      items.push(...this.getTaskConfigurationCompletions(context));
    } else if (context.isInTaskChain) {
      items.push(...this.getTaskChainCompletions(context));
    } else if (context.isTopLevel) {
      items.push(...this.getTopLevelCompletions(context));
    }

    // Add specific completions based on what's expected
    if (context.expectsTaskName) {
      items.push(...this.getTaskNameCompletions(context));
    } else if (context.expectsDataName) {
      items.push(...this.getDataNameCompletions(context));
    } else if (context.expectsParameterName) {
      items.push(...this.getParameterNameCompletions(context));
    }

    return items;
  }

  private getTopLevelCompletions(context: CompletionContext): CompletionItem[] {
    return [
      {
        label: 'workflow',
        kind: CompletionItemKind.Snippet,
        insertText: 'workflow ${1:WorkflowName} {\n\t$0\n}',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Create a new workflow',
        detail: 'workflow snippet',
        sortText: '0_workflow',
      },
      {
        label: 'workflow from',
        kind: CompletionItemKind.Snippet,
        insertText: 'workflow ${1:ChildWorkflow} from ${2:ParentWorkflow} {\n\t$0\n}',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Create a workflow that inherits from another',
        detail: 'workflow inheritance snippet',
        sortText: '0_workflow_from',
      },
    ];
  }

  private getWorkflowBodyCompletions(context: CompletionContext): CompletionItem[] {
    const items: CompletionItem[] = [];

    // Keywords
    items.push(
      {
        label: 'define task',
        kind: CompletionItemKind.Snippet,
        insertText: 'define task ${1:taskName};',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Define a new task',
        sortText: '1_define_task',
      },
      {
        label: 'define data',
        kind: CompletionItemKind.Snippet,
        insertText: 'define data ${1:dataName};',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Define a data item',
        sortText: '1_define_data',
      },
      {
        label: 'configure task',
        kind: CompletionItemKind.Snippet,
        insertText: 'configure task ${1:taskName} {\n\t${2:implementation "${3:script.py}";}\n\t$0\n}',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Configure a task',
        sortText: '1_configure_task',
      }
    );

    // Task chain snippet
    if (!context.hasTaskChain) {
      items.push({
        label: 'task chain',
        kind: CompletionItemKind.Snippet,
        insertText: 'START -> ${1:task1} -> ${2:task2} -> END;',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Define the task execution chain',
        detail: 'Define the order in which tasks are executed',
        sortText: '0_task_chain',
      });
    }

    return items;
  }

  private getTaskConfigurationCompletions(context: CompletionContext): CompletionItem[] {
    const items: CompletionItem[] = [];

    items.push(
      {
        label: 'implementation',
        kind: CompletionItemKind.Snippet,
        insertText: 'implementation "${1:script.py}";',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Specify the implementation file',
        sortText: '1_implementation',
      },
      {
        label: 'param',
        kind: CompletionItemKind.Snippet,
        insertText: 'param ${1:paramName};',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Define a parameter without default value',
        sortText: '1_param',
      },
      {
        label: 'param with value',
        kind: CompletionItemKind.Snippet,
        insertText: 'param ${1:paramName} = ${2:value};',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Define a parameter with default value',
        sortText: '1_param_value',
      },
      {
        label: 'input',
        kind: CompletionItemKind.Snippet,
        insertText: 'input ${1:dataName};',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Specify input data',
        sortText: '1_input',
      },
      {
        label: 'output',
        kind: CompletionItemKind.Snippet,
        insertText: 'output ${1:dataName};',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Specify output data',
        sortText: '1_output',
      }
    );

    return items;
  }

  private getTaskChainCompletions(context: CompletionContext): CompletionItem[] {
    const items: CompletionItem[] = [];
    const symbolTable = this.documentManager.getSymbolTable();

    // Add START and END
    if (!context.hasStart) {
      items.push({
        label: 'START',
        kind: CompletionItemKind.Constant,
        insertText: 'START',
        documentation: 'Start of the task chain',
        sortText: '0_START',
      });
    }

    if (context.canAddEnd) {
      items.push({
        label: 'END',
        kind: CompletionItemKind.Constant,
        insertText: 'END',
        documentation: 'End of the task chain',
        sortText: '0_END',
      });
    }

    // Add available tasks
    if (context.workflow) {
      const tasks = symbolTable.getWorkflowTasks(context.workflow);
      for (const task of tasks) {
        if (!context.usedTasks.has(task.name)) {
          items.push({
            label: task.name,
            kind: CompletionItemKind.Function,
            insertText: task.name,
            detail: 'task',
            documentation: task.documentation,
            sortText: `1_${task.name}`,
          });
        }
      }
    }

    return items;
  }

  private getTaskNameCompletions(context: CompletionContext): CompletionItem[] {
    const items: CompletionItem[] = [];
    const symbolTable = this.documentManager.getSymbolTable();

    if (context.workflow) {
      const tasks = symbolTable.getWorkflowTasks(context.workflow);
      for (const task of tasks) {
        items.push({
          label: task.name,
          kind: CompletionItemKind.Function,
          insertText: task.name,
          detail: `task in ${context.workflow}`,
          documentation: task.documentation,
          sortText: `1_${task.name}`,
        });
      }
    }

    return items;
  }

  private getDataNameCompletions(context: CompletionContext): CompletionItem[] {
    const items: CompletionItem[] = [];
    const symbolTable = this.documentManager.getSymbolTable();

    // Get data from current workflow
    if (context.workflow) {
      const workflowData = symbolTable.getWorkflowData(context.workflow);
      for (const data of workflowData) {
        items.push({
          label: data.name,
          kind: CompletionItemKind.Variable,
          insertText: data.name,
          detail: 'data',
          documentation: data.documentation,
          sortText: `1_${data.name}`,
        });
      }
    }

    // If in task configuration, also add data produced by previous tasks
    if (context.isInTaskConfiguration && context.task) {
      const availableData = this.getAvailableDataForTask(context.workflow!, context.task);
      for (const data of availableData) {
        if (!items.some(item => item.label === data.name)) {
          items.push({
            label: data.name,
            kind: CompletionItemKind.Variable,
            insertText: data.name,
            detail: `produced by ${data.producer}`,
            documentation: data.documentation,
            sortText: `2_${data.name}`,
          });
        }
      }
    }

    return items;
  }

  private getParameterNameCompletions(context: CompletionContext): CompletionItem[] {
    const items: CompletionItem[] = [];

    // TODO Suggest common parameter names
    const commonParams = [
      { name: 'learningRate', doc: 'Learning rate for training' },
      { name: 'batchSize', doc: 'Batch size for processing' },
      { name: 'epochs', doc: 'Number of training epochs' },
      { name: 'seed', doc: 'Random seed for reproducibility' },
      { name: 'threshold', doc: 'Threshold value' },
      { name: 'iterations', doc: 'Number of iterations' },
      { name: 'timeout', doc: 'Timeout in seconds' },
      { name: 'verbose', doc: 'Enable verbose output' },
    ];

    for (const param of commonParams) {
      items.push({
        label: param.name,
        kind: CompletionItemKind.Property,
        insertText: param.name,
        documentation: param.doc,
        sortText: `2_${param.name}`,
      });
    }

    return items;
  }

  private getAvailableDataForTask(workflow: string, taskName: string): any[] {
    const symbolTable = this.documentManager.getSymbolTable();
    const workflowInfo = symbolTable.getWorkflowInfo(workflow);
    
    if (!workflowInfo || !workflowInfo.taskChain) return [];

    const availableData: any[] = [];
    const taskOrder = workflowInfo.taskChain.elements;
    const taskIndex = taskOrder.indexOf(taskName);

    if (taskIndex === -1) return [];

    // Get data produced by tasks executed before this one
    for (let i = 0; i < taskIndex; i++) {
      const prevTask = workflowInfo.tasks.find(t => t.name === taskOrder[i]);
      if (prevTask) {
        for (const output of prevTask.outputs) {
          availableData.push({
            name: output,
            producer: prevTask.name,
            documentation: `Output from task ${prevTask.name}`,
          });
        }
      }
    }

    return availableData;
  }
}