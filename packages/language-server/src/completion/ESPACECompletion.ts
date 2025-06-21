// packages/language-server/src/completion/ESPACECompletions.ts
import { CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver/node.js';
import { DocumentManager } from '../documents/DocumentManager.js';
import { CompletionContext } from './CompletionContext.js';

export class ESPACECompletions {
  constructor(private documentManager: DocumentManager) {}

  async getCompletions(context: CompletionContext): Promise<CompletionItem[]> {
    const items: CompletionItem[] = [];

    // Add context-specific completions
    if (context.isInExperimentBody) {
      items.push(...this.getExperimentBodyCompletions(context));
    } else if (context.isInSpaceBody) {
      items.push(...this.getSpaceBodyCompletions(context));
    } else if (context.isInControlBlock) {
      items.push(...this.getControlBlockCompletions(context));
    } else if (context.isInTaskConfiguration) {
      items.push(...this.getTaskConfigurationCompletions(context));
    } else if (context.isTopLevel) {
      items.push(...this.getTopLevelCompletions(context));
    }

    // Add specific completions based on what's expected
    if (context.expectsWorkflowName) {
      items.push(...this.getWorkflowNameCompletions(context));
    } else if (context.expectsSpaceName) {
      items.push(...this.getSpaceNameCompletions(context));
    } else if (context.expectsStrategyName) {
      items.push(...this.getStrategyCompletions(context));
    } else if (context.expectsTaskName) {
      items.push(...this.getTaskNameCompletions(context));
    }

    return items;
  }

  private getTopLevelCompletions(context: CompletionContext): CompletionItem[] {
    return [
      {
        label: 'experiment',
        kind: CompletionItemKind.Snippet,
        insertText: 'experiment ${1:ExperimentName} {\n\t$0\n}',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Create a new experiment',
        detail: 'experiment snippet',
        sortText: '0_experiment',
      },
    ];
  }

  private getExperimentBodyCompletions(context: CompletionContext): CompletionItem[] {
    const items: CompletionItem[] = [];

    items.push(
      {
        label: 'space',
        kind: CompletionItemKind.Snippet,
        insertText:
          'space ${1:SpaceName} of ${2:WorkflowName} {\n\tstrategy ${3:gridsearch};\n\t$0\n}',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Define a parameter space',
        sortText: '0_space',
      },
      {
        label: 'control',
        kind: CompletionItemKind.Snippet,
        insertText: 'control {\n\tSTART -> ${1:Space1} -> END;\n\t$0\n}',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Define control flow',
        sortText: '0_control',
      },
      {
        label: 'define data',
        kind: CompletionItemKind.Snippet,
        insertText: 'define data ${1:dataName} = "${2:path/to/data}";',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Define experiment-level data',
        sortText: '1_define_data',
      }
    );

    return items;
  }

  private getSpaceBodyCompletions(context: CompletionContext): CompletionItem[] {
    const items: CompletionItem[] = [];

    // Strategy
    if (!context.hasStrategy) {
      items.push({
        label: 'strategy',
        kind: CompletionItemKind.Snippet,
        insertText: 'strategy ${1|gridsearch,randomsearch|};',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Set the search strategy',
        sortText: '0_strategy',
      });
    }

    // Parameters
    items.push(
      {
        label: 'param enum',
        kind: CompletionItemKind.Snippet,
        insertText: 'param ${1:paramName} = enum(${2:value1}, ${3:value2}${4:, value3});',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Define enumeration parameter',
        sortText: '1_param_enum',
      },
      {
        label: 'param range',
        kind: CompletionItemKind.Snippet,
        insertText: 'param ${1:paramName} = range(${2:min}, ${3:max}, ${4:step});',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Define range parameter',
        sortText: '1_param_range',
      },
      {
        label: 'param value',
        kind: CompletionItemKind.Snippet,
        insertText: 'param ${1:paramName} = ${2:value};',
        insertTextFormat: InsertTextFormat.Snippet,
        documentation: 'Define fixed parameter',
        sortText: '1_param_value',
      }
    );

    // Task configuration
    items.push({
      label: 'configure task',
      kind: CompletionItemKind.Snippet,
      insertText: 'configure task ${1:taskName} {\n\tparam ${2:paramName} = ${3:value};\n\t$0\n}',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: 'Configure task parameters',
      sortText: '1_configure_task',
    });

    // Data definition
    items.push({
      label: 'define data',
      kind: CompletionItemKind.Snippet,
      insertText: 'define data ${1:dataName} = "${2:path/to/data}";',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: 'Define space-level data',
      sortText: '1_define_data',
    });

    return items;
  }

  private getControlBlockCompletions(context: CompletionContext): CompletionItem[] {
    const items: CompletionItem[] = [];
    const symbolTable = this.documentManager.getSymbolTable();

    // Simple transition
    items.push({
      label: 'transition',
      kind: CompletionItemKind.Snippet,
      insertText: '${1:From} -> ${2:To};',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: 'Add a transition',
      sortText: '1_transition',
    });

    // Conditional transition
    items.push({
      label: 'conditional transition',
      kind: CompletionItemKind.Snippet,
      insertText: '${1:From} -?> ${2:To} {\n\tcondition "${3:expression}";\n}',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: 'Add a conditional transition',
      sortText: '1_conditional',
    });

    // START
    if (!context.hasStart) {
      items.push({
        label: 'START',
        kind: CompletionItemKind.Constant,
        insertText: 'START',
        documentation: 'Start node',
        sortText: '0_START',
      });
    }

    // END
    items.push({
      label: 'END',
      kind: CompletionItemKind.Constant,
      insertText: 'END',
      documentation: 'End node',
      sortText: '0_END',
    });

    // Available spaces
    if (context.experiment) {
      const spaces = symbolTable.getExperimentSpaces(context.experiment);
      for (const space of spaces) {
        items.push({
          label: space.name,
          kind: CompletionItemKind.Module,
          insertText: space.name,
          detail: 'space',
          documentation: space.documentation,
          sortText: `1_${space.name}`,
        });
      }
    }

    return items;
  }

  private getTaskConfigurationCompletions(context: CompletionContext): CompletionItem[] {
    const items: CompletionItem[] = [];
    const symbolTable = this.documentManager.getSymbolTable();

    items.push({
      label: 'param',
      kind: CompletionItemKind.Snippet,
      insertText: 'param ${1:paramName} = ${2:value};',
      insertTextFormat: InsertTextFormat.Snippet,
      documentation: 'Override parameter value',
      sortText: '1_param',
    });

    // Get available parameters from the task
    if (context.task && context.workflow) {
      const taskInfo = symbolTable.getTaskInfo(context.workflow, context.task);
      if (taskInfo) {
        for (const param of taskInfo.parameters) {
          items.push({
            label: param.name,
            kind: CompletionItemKind.Property,
            insertText: `param ${param.name} = \${1:value};`,
            insertTextFormat: InsertTextFormat.Snippet,
            detail: param.type || 'parameter',
            documentation: param.documentation,
            sortText: `2_${param.name}`,
          });
        }
      }
    }

    return items;
  }

  private getWorkflowNameCompletions(context: CompletionContext): CompletionItem[] {
    const items: CompletionItem[] = [];
    const symbolTable = this.documentManager.getSymbolTable();

    const workflows = symbolTable.getAllSymbols('workflow');
    for (const workflow of workflows) {
      items.push({
        label: workflow.name,
        kind: CompletionItemKind.Class,
        insertText: workflow.name,
        detail: 'workflow',
        documentation: workflow.documentation,
        sortText: `1_${workflow.name}`,
      });
    }

    return items;
  }

  private getSpaceNameCompletions(context: CompletionContext): CompletionItem[] {
    const items: CompletionItem[] = [];
    const symbolTable = this.documentManager.getSymbolTable();

    if (context.experiment) {
      const spaces = symbolTable.getExperimentSpaces(context.experiment);
      for (const space of spaces) {
        items.push({
          label: space.name,
          kind: CompletionItemKind.Module,
          insertText: space.name,
          detail: 'space',
          documentation: space.documentation,
          sortText: `1_${space.name}`,
        });
      }
    }

    return items;
  }

  private getStrategyCompletions(context: CompletionContext): CompletionItem[] {
    return [
      {
        label: 'gridsearch',
        kind: CompletionItemKind.EnumMember,
        insertText: 'gridsearch',
        documentation: 'Grid search strategy - exhaustive search over all parameter combinations',
        sortText: '1_gridsearch',
      },
      {
        label: 'randomsearch',
        kind: CompletionItemKind.EnumMember,
        insertText: 'randomsearch',
        documentation: 'Random search strategy - sample random parameter combinations',
        sortText: '1_randomsearch',
      },
    ];
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
}
