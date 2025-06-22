import { Provider } from './Provider';
import { Logger } from '../utils/Logger';
import { Hover, HoverParams, MarkupContent } from 'vscode-languageserver';
import { DataSymbol } from '../core/models/symbols/DataSymbol';
import { TaskSymbol } from '../core/models/symbols/TaskSymbol';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol';

export class HoverProvider extends Provider {
	private logger = Logger.getLogger();

	addHandlers(): void {
		this.connection?.onHover((params) => this.onHover(params));
	}

	private async onHover(params: HoverParams): Promise<Hover | undefined> {
		this.logger.info(`Recieved hover request for document: ${params.textDocument.uri}`);

		const result = super.getDocumentAndPosition(params.textDocument, params.position);
		if (!result) return;
		const [document, tokenPosition] = result;

		if (document.symbolTable === undefined) return;

		const symbol = await document.workflowSymbolTable?.resolve(tokenPosition.text, true);
		if (symbol instanceof TaskSymbol) {
			return { contents: this.getTaskHoverInformation(symbol) };
		}

		if (symbol instanceof DataSymbol) {
			return { contents: this.getDataHoverInformation(symbol) };
		}

		this.logger.debug(`No hover information available for symbol: ${tokenPosition.text}`);
		return { contents: [] };
	}

	private getTaskHoverInformation(task: TaskSymbol): MarkupContent {
		let content = `### Task: ${task.name}\n\n`;

		// Add parameters if available
		if (task.params.length > 0) {
			content += `**Parameters:**\n\n`;
			content += task.params.map(param => `- \`${param}\``).join('\n') + '\n\n';
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