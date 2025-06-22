import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { Hover, HoverParams, MarkupContent } from 'vscode-languageserver';
import { DataSymbol } from '../core/symbols/DataSymbol.js';
import { TaskSymbol } from '../core/symbols/TaskSymbol.js';
import { WorkflowSymbol } from '../core/symbols/WorkflowSymbol.js';
import { SpaceSymbol } from '../core/symbols/SpaceSymbol.js';
import { ExperimentSymbol } from '../core/symbols/ExperimentSymbol.js';

export class HoverProvider extends Provider {
    private logger = Logger.getInstance();

    public addHandlers(): void {
        this.connection?.onHover((params) => this.onHover(params));
    }

    private async onHover(params: HoverParams): Promise<Hover | undefined> {
        this.logger.info(`Received hover request for document: ${params.textDocument.uri}`);

        const result = this.getDocumentAndPosition(params.textDocument, params.position);
        if (!result) return undefined;
        const [document, tokenPosition] = result;

        if (!document.symbolTable) return undefined;

        const symbol = await this.findSymbolAtPosition(document, tokenPosition.text);
        if (!symbol) {
            this.logger.debug(`No hover information available for symbol: ${tokenPosition.text}`);
            return undefined;
        }

        return { contents: this.getHoverContent(symbol) };
    }

    private async findSymbolAtPosition(document: Document, text: string): Promise<any> {
        if (!document.symbolTable) return undefined;

        // Search in different symbol types
        const allSymbols = await document.symbolTable.getAllNestedSymbols();
        return allSymbols.find(symbol => symbol.name === text);
    }

    private getHoverContent(symbol: any): MarkupContent {
        if (symbol instanceof TaskSymbol) {
            return this.getTaskHoverInformation(symbol);
        } else if (symbol instanceof DataSymbol) {
            return this.getDataHoverInformation(symbol);
        } else if (symbol instanceof WorkflowSymbol) {
            return this.getWorkflowHoverInformation(symbol);
        } else if (symbol instanceof SpaceSymbol) {
            return this.getSpaceHoverInformation(symbol);
        } else if (symbol instanceof ExperimentSymbol) {
            return this.getExperimentHoverInformation(symbol);
        }

        return {
            kind: 'markdown',
            value: `**${symbol.constructor.name}**: ${symbol.name}`
        };
    }

    private getTaskHoverInformation(task: TaskSymbol): MarkupContent {
        let content = `### Task: ${task.name}\n\n`;

        if (task.implementation) {
            content += `**Implementation:** \`${task.implementation}\`\n\n`;
        }

        if (task.params.length > 0) {
            content += `**Parameters:**\n${task.params.map(param => `- \`${param}\``).join('\n')}\n\n`;
        }

        if (task.inputs.length > 0) {
            content += `**Inputs:**\n${task.inputs.map(input => `- \`${input}\``).join('\n')}\n\n`;
        }

        if (task.outputs.length > 0) {
            content += `**Outputs:**\n${task.outputs.map(output => `- \`${output}\``).join('\n')}\n\n`;
        }

        content += `**References:** ${task.references.length}`;

        return {
            kind: 'markdown',
            value: content.trim()
        };
    }

    private getDataHoverInformation(data: DataSymbol): MarkupContent {
        let content = `### Data: ${data.name}\n\n`;

        if (data.value) {
            content += `**Value:** \`${data.value}\`\n\n`;
        }

        content += `**References:** ${data.references.length}`;

        return {
            kind: 'markdown',
            value: content.trim()
        };
    }

    private getWorkflowHoverInformation(workflow: WorkflowSymbol): MarkupContent {
        let content = `### Workflow: ${workflow.name}\n\n`;

        if (workflow.parentWorkflow) {
            content += `**Inherits from:** \`${workflow.parentWorkflow.name}\`\n\n`;
        }

        const tasks = workflow.getNestedSymbolsOfTypeSync(TaskSymbol);
        const data = workflow.getNestedSymbolsOfTypeSync(DataSymbol);

        content += `**Tasks:** ${tasks.length}\n`;
        content += `**Data:** ${data.length}\n`;
        content += `**References:** ${workflow.references.length}`;

        return {
            kind: 'markdown',
            value: content.trim()
        };
    }

    private getSpaceHoverInformation(space: SpaceSymbol): MarkupContent {
        let content = `### Space: ${space.name}\n\n`;
        content += `**Workflow:** \`${space.workflowName}\`\n\n`;

        if (space.strategy) {
            content += `**Strategy:** \`${space.strategy}\`\n\n`;
        }

        if (space.params.size > 0) {
            content += `**Parameters:** ${space.params.size}\n`;
            for (const [key, value] of space.params.entries()) {
                content += `- \`${key}\`: ${JSON.stringify(value)}\n`;
            }
            content += '\n';
        }

        content += `**References:** ${space.references.length}`;

        return {
            kind: 'markdown',
            value: content.trim()
        };
    }

    private getExperimentHoverInformation(experiment: ExperimentSymbol): MarkupContent {
        let content = `### Experiment: ${experiment.name}\n\n`;

        const spaces = experiment.getNestedSymbolsOfTypeSync(SpaceSymbol);
        const data = experiment.getNestedSymbolsOfTypeSync(DataSymbol);

        content += `**Spaces:** ${spaces.length}\n`;
        content += `**Data:** ${data.length}\n`;
        content += `**References:** ${experiment.references.length}`;

        return {
            kind: 'markdown',
            value: content.trim()
        };
    }
}