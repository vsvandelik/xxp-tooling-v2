import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { DataSymbol } from '../core/models/symbols/DataSymbol.js';
import { TaskSymbol } from '../core/models/symbols/TaskSymbol.js';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { ExperimentSymbol } from '../core/models/symbols/ExperimentSymbol.js';
import { SpaceSymbol } from '../core/models/symbols/SpaceSymbol.js';
export class HoverProvider extends Provider {
    logger = Logger.getLogger();
    addHandlers() {
        this.connection?.onHover(params => this.onHover(params));
    }
    async onHover(params) {
        this.logger.info(`Received hover request for document: ${params.textDocument.uri}`);
        const result = super.getDocumentAndPosition(params.textDocument, params.position);
        if (!result)
            return;
        const [document, tokenPosition] = result;
        if (document.symbolTable === undefined)
            return;
        let symbol;
        if (document.workflowSymbolTable) {
            symbol = await document.workflowSymbolTable.resolve(tokenPosition.text, true);
        }
        if (!symbol) {
            const experimentSymbol = document.symbolTable.children.find(c => c instanceof ExperimentSymbol);
            if (experimentSymbol) {
                symbol = await experimentSymbol.resolve(tokenPosition.text, true);
            }
        }
        if (!symbol) {
            const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(document.uri);
            if (folderSymbolTable) {
                symbol = await folderSymbolTable.resolve(tokenPosition.text, false);
            }
        }
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
    getWorkflowHoverInformation(workflow) {
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
    getSpaceHoverInformation(space) {
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
    getTaskHoverInformation(task) {
        let content = `### Task: ${task.name}\n\n`;
        if (task.params.length > 0) {
            content += `**Parameters:**\n\n`;
            content += task.params.map(param => `- \`${param.name}\``).join('\n') + '\n\n';
        }
        if (task.implementation) {
            if (typeof task.implementation === 'string') {
                content += `**Implementation:**\n\n`;
                content += `\`${task.implementation}\`\n\n`;
            }
            else if (task.implementation instanceof WorkflowSymbol) {
                content += `**Implementation:**\n\n`;
                content += `Reference to \`${task.implementation.name}\`\n\n`;
            }
        }
        else {
            content += `**Implementation:**\n\nNone\n\n`;
        }
        return {
            kind: 'markdown',
            value: content.trim(),
        };
    }
    getDataHoverInformation(data) {
        let content = `### Data: ${data.name}\n\n`;
        if (data.schemaFilePath) {
            content += `**Schema File Path:**\n\n`;
            content += `\`${data.schemaFilePath}\`\n\n`;
        }
        else {
            content += `**Schema File Path:**\n\nNone\n\n`;
        }
        return {
            kind: 'markdown',
            value: content.trim(),
        };
    }
}
//# sourceMappingURL=HoverProvider.js.map