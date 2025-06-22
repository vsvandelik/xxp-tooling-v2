import { Provider } from './Provider';
import { Logger } from '../utils/Logger';
import {
	RenameParams,
	WorkspaceEdit,
	TextEdit
} from 'vscode-languageserver';
import { TerminalSymbolWithReferences } from '../core/models/symbols/TerminalSymbolWithReferences';
import { TerminalSymbolReference } from '../core/models/TerminalSymbolReference';
import { RangeUtils } from '../utils/RangeUtils';
import { DataDefinitionContext, TaskDefinitionContext, WorkflowHeaderContext } from '@extremexp/core/src/language/generated/XXPParser';

type RuleWithIdentifiers = DataDefinitionContext | TaskDefinitionContext | WorkflowHeaderContext;

export class RenamerProvider extends Provider {
	private logger = Logger.getLogger();

	addHandlers(): void {
		this.connection!.onRenameRequest(params => this.onRenameRequest(params));
	}

	private async onRenameRequest(params: RenameParams): Promise<WorkspaceEdit | null> {
		this.logger.info(`Received rename request for document: ${params.textDocument.uri}, new name: ${params.newName}`);

		const result = super.getDocumentAndPosition(params.textDocument, params.position);
		if (!result) return null;
		const [document, tokenPosition] = result;

		// Only support terminal symbols, not workflows
		const terminalSymbol = await document.workflowSymbolTable?.resolve(tokenPosition.text, true);
		if (!(terminalSymbol instanceof TerminalSymbolWithReferences)) return null;

		if (!terminalSymbol.context) return null;

		// Validate the new name
		if (!this.isValidIdentifier(params.newName)) {
			this.logger.warn(`Invalid identifier for rename: ${params.newName}`);
			return null;
		}

		const references = [...terminalSymbol.references];
		// Add the symbol definition itself to the references
		const context = terminalSymbol.context as RuleWithIdentifiers;
		const identifier = context.IDENTIFIER();
		if (identifier) references.push(new TerminalSymbolReference(
			identifier,
			terminalSymbol.document
		));

		const changes: { [uri: string]: TextEdit[] } = {};

		for (const reference of references) {
			const refDocument = reference.document ?? document;
			const uri = refDocument.uri;
			const range = RangeUtils.getRangeFromParseTree(reference.node);
			if (!range) continue;

			if (!changes[uri]) {
				changes[uri] = [];
			}
			changes[uri].push(TextEdit.replace(range, params.newName));
		}

		return { changes };
	}

	private isValidIdentifier(name: string): boolean {
		// Basic identifier validation - adjust according to your language rules
		if (!name || name.trim() !== name) return false;

		// Check if it starts with letter or underscore and contains only alphanumeric characters and underscores
		const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
		return identifierRegex.test(name);
	}
}