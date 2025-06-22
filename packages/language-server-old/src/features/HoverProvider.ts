import { TextDocumentPositionParams, Hover, MarkupKind } from 'vscode-languageserver/node.js';
import { DocumentManager } from '../documents/DocumentManager.js';
import { ASTUtils } from '../utils/ASTUtils.js';

export class HoverProvider {
  constructor(private documentManager: DocumentManager) {}

  async provideHover(params: TextDocumentPositionParams): Promise<Hover | null> {
    const document = this.documentManager.getDocument(params.textDocument.uri);
    if (!document || !document.parseTree) return null;

    const position = params.position;
    const node = this.documentManager.getNodeAtPosition(
      params.textDocument.uri,
      position.line,
      position.character
    );

    if (!node) return null;

    // Get symbol or reference information
    const symbolInfo = ASTUtils.getSymbolInfo(node, document.languageId);
    const referenceInfo = ASTUtils.getReferenceInfo(node, document.languageId);

    const info = symbolInfo || referenceInfo;
    if (!info) return null;

    // Generate hover content based on symbol type
    const content = this.generateHoverContent(info, document.languageId);
    if (!content) return null;

    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: content,
      },
      range: info.range,
    };
  }

  private generateHoverContent(info: any, languageId: string): string | null {
    const symbolTable = this.documentManager.getSymbolTable();

    switch (info.type) {
      case 'workflow':
        return this.generateWorkflowHover(info.name);

      case 'experiment':
        return this.generateExperimentHover(info.name);

      case 'task':
        return this.generateTaskHover(info.name, info.workflow);

      case 'parameter':
        return this.generateParameterHover(info.name, info.task, info.workflow);

      case 'data':
        return this.generateDataHover(info.name, info.scope);

      case 'space':
        return this.generateSpaceHover(info.name, info.experiment);

      case 'strategy':
        return this.generateStrategyHover(info.name);

      default:
        return null;
    }
  }

  private generateWorkflowHover(name: string): string {
    const symbolTable = this.documentManager.getSymbolTable();
    const workflow = symbolTable.getWorkflowInfo(name);

    if (!workflow) {
      return `**Workflow:** ${name}\n\n*Not found*`;
    }

    let content = `**Workflow:** ${name}\n\n`;

    if (workflow.parentWorkflow) {
      content += `**Inherits from:** ${workflow.parentWorkflow}\n\n`;
    }

    if (workflow.tasks.length > 0) {
      content += `**Tasks:** ${workflow.tasks.length}\n`;
      const taskList = workflow.tasks
        .slice(0, 5)
        .map(t => `- ${t.name}`)
        .join('\n');
      content += taskList;
      if (workflow.tasks.length > 5) {
        content += `\n- ... and ${workflow.tasks.length - 5} more`;
      }
      content += '\n\n';
    }

    if (workflow.data.length > 0) {
      content += `**Data:** ${workflow.data.length}\n`;
      const dataList = workflow.data
        .slice(0, 5)
        .map(d => `- ${d.name}`)
        .join('\n');
      content += dataList;
      if (workflow.data.length > 5) {
        content += `\n- ... and ${workflow.data.length - 5} more`;
      }
    }

    return content;
  }

  private generateExperimentHover(name: string): string {
    const symbolTable = this.documentManager.getSymbolTable();
    const experiment = symbolTable.getExperiment(name);

    if (!experiment) {
      return `**Experiment:** ${name}\n\n*Not found*`;
    }

    let content = `**Experiment:** ${name}\n\n`;

    if (experiment.spaces && experiment.spaces.length > 0) {
      content += `**Spaces:** ${experiment.spaces.length}\n`;
      for (const space of experiment.spaces.slice(0, 5)) {
        content += `- ${space.name} (${space.workflowName})\n`;
      }
      if (experiment.spaces.length > 5) {
        content += `- ... and ${experiment.spaces.length - 5} more\n`;
      }
    }

    return content;
  }

  private generateTaskHover(name: string, workflowName?: string): string {
    if (!workflowName) {
      return `**Task:** ${name}\n\n*Workflow context not found*`;
    }

    const symbolTable = this.documentManager.getSymbolTable();
    const task = symbolTable.getTaskInfo(workflowName, name);

    if (!task) {
      return `**Task:** ${name}\n\n*Not found in workflow ${workflowName}*`;
    }

    let content = `**Task:** ${name}\n`;
    content += `**Workflow:** ${workflowName}\n\n`;

    if (task.implementation) {
      content += `**Implementation:** \`${task.implementation}\`\n\n`;
    } else {
      content += `**Implementation:** *Not specified (abstract task)*\n\n`;
    }

    if (task.parameters.length > 0) {
      content += `**Parameters:**\n`;
      for (const param of task.parameters.slice(0, 5)) {
        const required = param.required ? ' *(required)*' : '';
        const defaultVal = param.hasDefault ? ` = ${param.defaultValue}` : '';
        content += `- ${param.name}${defaultVal}${required}\n`;
      }
      if (task.parameters.length > 5) {
        content += `- ... and ${task.parameters.length - 5} more\n`;
      }
      content += '\n';
    }

    if (task.inputs.length > 0) {
      content += `**Inputs:** ${task.inputs.join(', ')}\n`;
    }

    if (task.outputs.length > 0) {
      content += `**Outputs:** ${task.outputs.join(', ')}\n`;
    }

    return content;
  }

  private generateParameterHover(name: string, taskName?: string, workflowName?: string): string {
    let content = `**Parameter:** ${name}\n`;

    if (taskName && workflowName) {
      const symbolTable = this.documentManager.getSymbolTable();
      const param = symbolTable.getParameterInfo(taskName, name);

      if (param) {
        content += `**Task:** ${taskName}\n`;
        content += `**Workflow:** ${workflowName}\n\n`;

        if (param.type) {
          content += `**Type:** ${param.type}\n`;
        }

        if (param.hasDefault) {
          content += `**Default value:** ${param.defaultValue}\n`;
        }

        if (param.required) {
          content += `**Required:** Yes\n`;
        }
      }
    }

    return content;
  }

  private generateDataHover(name: string, scope: string): string {
    const symbolTable = this.documentManager.getSymbolTable();
    const dataSymbol = symbolTable.resolveSymbol(name, scope, 'data');

    let content = `**Data:** ${name}\n`;

    if (dataSymbol && dataSymbol.data) {
      const data = dataSymbol.data;
      if (data.value) {
        content += `**Value:** \`${data.value}\`\n`;
      }
      content += `**Scope:** ${scope}\n`;
    }

    // Find which tasks produce or consume this data
    const producers: string[] = [];
    const consumers: string[] = [];

    // This would require scanning all tasks in the symbol table
    // For now, we'll just indicate this information could be shown
    content += '\n*Used by tasks in the workflow*';

    return content;
  }

  private generateSpaceHover(name: string, experimentName?: string): string {
    let content = `**Space:** ${name}\n`;

    if (experimentName) {
      content += `**Experiment:** ${experimentName}\n\n`;

      const symbolTable = this.documentManager.getSymbolTable();
      const experiment = symbolTable.getExperiment(experimentName);

      if (experiment) {
        const space = experiment.spaces?.find((s: any) => s.name === name);

        if (space) {
          content += `**Workflow:** ${space.workflowName}\n`;
          content += `**Strategy:** ${space.strategy}\n\n`;

          if (space.parameters && space.parameters.length > 0) {
            content += `**Parameters:** ${space.parameters.length}\n`;
            for (const param of space.parameters.slice(0, 3)) {
              content += `- ${param.name} (${param.type})\n`;
            }
            if (space.parameters.length > 3) {
              content += `- ... and ${space.parameters.length - 3} more\n`;
            }
          }
        }
      }
    }

    return content;
  }

  private generateStrategyHover(name: string): string {
    const strategies: Record<string, string> = {
      gridsearch: `**Grid Search Strategy**

Exhaustively searches through all possible parameter combinations.

- **Pros:** Guarantees finding the best combination within the search space
- **Cons:** Can be computationally expensive for large parameter spaces

**Example:**
\`\`\`
param learning_rate = enum(0.01, 0.1, 1.0);
param batch_size = enum(16, 32, 64);
// Results in 3 × 3 = 9 combinations
\`\`\``,

      randomsearch: `**Random Search Strategy**

Randomly samples parameter combinations from the search space.

- **Pros:** More efficient for large parameter spaces
- **Cons:** May miss the optimal combination

**Example:**
\`\`\`
param learning_rate = range(0.001, 1.0, 0.001);
param batch_size = enum(16, 32, 64, 128);
// Randomly samples from the space
\`\`\``,
    };

    return strategies[name] || `**Strategy:** ${name}`;
  }
}
