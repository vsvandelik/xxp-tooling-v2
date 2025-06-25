import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { Hover, HoverParams, MarkupContent } from 'vscode-languageserver';
import { DataSymbol } from '../core/models/symbols/DataSymbol.js';
import { TaskSymbol } from '../core/models/symbols/TaskSymbol.js';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { BaseSymbol } from 'antlr4-c3';
import { ExperimentSymbol } from '../core/models/symbols/ExperimentSymbol.js';
import { SpaceSymbol } from '../core/models/symbols/SpaceSymbol.js';
import { SymbolResolver } from '../utils/SymbolResolver.js';

export class HoverProvider extends Provider {
  private logger = Logger.getLogger();

  addHandlers(): void {
    this.connection?.onHover(params => this.onHover(params));
  }

  private async onHover(params: HoverParams): Promise<Hover | undefined> {
    this.logger.info(`Received hover request for document: ${params.textDocument.uri}`);

    const result = super.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return;
    const [document, tokenPosition] = result;

    if (document.symbolTable === undefined) return;

    // Use generic symbol resolver
    const symbol = await SymbolResolver.resolveSymbol({
      text: tokenPosition.text,
      contextName: tokenPosition.parseTree?.constructor?.name,
      document,
      documentManager: this.documentManager,
      localOnly: true  // For hover, prefer local resolution first
    });

    if (symbol instanceof TaskSymbol) {
      return { contents: this.getTaskHoverInformation(symbol) };
    }

    if (symbol instanceof DataSymbol) {
      return { contents: this.getDataHoverInformation(symbol) };
    }

    if (symbol instanceof WorkflowSymbol) {
      return { contents: this.getWorkflowHoverInformation(symbol) };
    }

    if (symbol instanceof SpaceSymbol) {
      return { contents: this.getSpaceHoverInformation(symbol) };
    }

    this.logger.debug(`No hover information available for symbol: ${tokenPosition.text}`);
    return { contents: [] };
  }

  // Add new hover information methods:

  private getWorkflowHoverInformation(workflow: WorkflowSymbol): MarkupContent {
    let content = `### Workflow: ${workflow.name}\n\n`;

    content += `**Defined in:** ${workflow.document.uri.split('/').pop()}\n\n`;

    if (workflow.parentWorkflowSymbol) {
      content += `**Extends:** ${workflow.parentWorkflowSymbol.name}\n\n`;
    }

    return {
      kind: 'markdown',
      value: content.trim(),
    };
  }

  private getSpaceHoverInformation(space: SpaceSymbol): MarkupContent {
    let content = `### Space: ${space.name}\n\n`;

    if (space.workflowReference) {
      content += `**Workflow:** ${space.workflowReference.name}\n\n`;
    }

    if (space.strategy) {
      content += `**Strategy:** ${space.strategy}\n\n`;
    }

    return {
      kind: 'markdown',
      value: content.trim(),
    };
  }

  private getTaskHoverInformation(task: TaskSymbol): MarkupContent {
    let content = `### Task: ${task.name}\n\n`;

    // Add parameters if available
    if (task.params.length > 0) {
      content += `**Parameters:**\n\n`;
      content += task.params.map(param => `- \`${param.name}\``).join('\n') + '\n\n';
    }

    // Add implementation details
    if (task.implementation) {
      if (typeof task.implementation === 'string') {
        content += `**Implementation:**\n\n`;
        content += `\`${task.implementation}\`\n\n`;
      } else if (task.implementation instanceof WorkflowSymbol) {
        content += `**Implementation:**\n\n`;
        content += `Reference to \`${task.implementation.name}\`\n\n`;
      }
    } else {
      content += `**Implementation:**\n\nNone\n\n`;
    }

    return {
      kind: 'markdown',
      value: content.trim(),
    };
  }

  private getDataHoverInformation(data: DataSymbol): MarkupContent {
    let content = `### Data: ${data.name}\n\n`;

    // Add schema file path if available
    if (data.schemaFilePath) {
      content += `**Schema File Path:**\n\n`;
      content += `\`${data.schemaFilePath}\`\n\n`;
    } else {
      content += `**Schema File Path:**\n\nNone\n\n`;
    }

    return {
      kind: 'markdown',
      value: content.trim(),
    };
  }
}
