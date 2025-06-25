import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { TextEdit } from 'vscode-languageserver';
import { TerminalSymbolWithReferences } from '../core/models/symbols/TerminalSymbolWithReferences.js';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { ExperimentSymbol } from '../core/models/symbols/ExperimentSymbol.js';
import { SpaceSymbol } from '../core/models/symbols/SpaceSymbol.js';
import { TerminalSymbolReference } from '../core/models/TerminalSymbolReference.js';
import { RangeUtils } from '../utils/RangeUtils.js';
import { XxpWorkflowNameReadContext, EspaceWorkflowNameReadContext, EspaceSpaceNameReadContext, EspaceTaskNameReadContext, } from '@extremexp/core';
export class RenamerProvider extends Provider {
    logger = Logger.getLogger();
    addHandlers() {
        this.connection.onRenameRequest(params => this.onRenameRequest(params));
    }
    async onRenameRequest(params) {
        this.logger.info(`Received rename request for document: ${params.textDocument.uri}, new name: ${params.newName}`);
        const result = super.getDocumentAndPosition(params.textDocument, params.position);
        if (!result)
            return null;
        const [document, tokenPosition] = result;
        if (!this.isValidIdentifier(params.newName)) {
            this.logger.warn(`Invalid identifier for rename: ${params.newName}`);
            return null;
        }
        const symbol = await this.resolveSymbol(document, tokenPosition);
        if (!symbol)
            return null;
        if (symbol.name === 'START' || symbol.name === 'END') {
            this.logger.warn(`Cannot rename built-in task: ${symbol.name}`);
            return null;
        }
        const references = await this.getAllReferencesForRename(symbol, document);
        const changes = {};
        for (const reference of references) {
            const refDocument = reference.document;
            const uri = refDocument.uri;
            const range = RangeUtils.getRangeFromParseTree(reference.node);
            if (!range)
                continue;
            if (!changes[uri]) {
                changes[uri] = [];
            }
            changes[uri].push(TextEdit.replace(range, params.newName));
        }
        return { changes };
    }
    async resolveSymbol(document, tokenPosition) {
        if (tokenPosition.parseTree instanceof XxpWorkflowNameReadContext ||
            tokenPosition.parseTree instanceof EspaceWorkflowNameReadContext) {
            const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(document.uri);
            return (await folderSymbolTable?.resolve(tokenPosition.text, false)) || null;
        }
        if (tokenPosition.parseTree instanceof EspaceSpaceNameReadContext) {
            const experimentSymbol = document.symbolTable?.children.find((c) => c instanceof ExperimentSymbol);
            if (experimentSymbol) {
                return (await experimentSymbol.resolve(tokenPosition.text, false)) || null;
            }
        }
        if (tokenPosition.parseTree instanceof EspaceTaskNameReadContext) {
            const experimentSymbol = document.symbolTable?.children.find((c) => c instanceof ExperimentSymbol);
            if (experimentSymbol) {
                const localSymbol = await experimentSymbol.resolve(tokenPosition.text, true);
                if (localSymbol)
                    return localSymbol;
                const spaces = await experimentSymbol.getSymbolsOfType(SpaceSymbol);
                for (const space of spaces) {
                    if (space.workflowReference) {
                        const workflowSymbol = await space.workflowReference.resolve(tokenPosition.text, false);
                        if (workflowSymbol)
                            return workflowSymbol;
                    }
                }
            }
        }
        if (document.workflowSymbolTable) {
            return (await document.workflowSymbolTable.resolve(tokenPosition.text, false)) || null;
        }
        return null;
    }
    async getAllReferencesForRename(symbol, document) {
        const references = [];
        if (symbol instanceof TerminalSymbolWithReferences ||
            symbol instanceof WorkflowSymbol ||
            symbol instanceof ExperimentSymbol) {
            references.push(...symbol.references);
            if (symbol.context) {
                const context = symbol.context;
                const identifier = context.IDENTIFIER?.();
                if (identifier) {
                    references.push(new TerminalSymbolReference(identifier, symbol.document));
                }
            }
        }
        if (symbol instanceof WorkflowSymbol) {
            const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(symbol.document.uri);
            if (folderSymbolTable) {
                const experiments = await folderSymbolTable.getSymbolsOfType(ExperimentSymbol);
                for (const experiment of experiments) {
                    const spaces = await experiment.getSymbolsOfType(SpaceSymbol);
                    for (const space of spaces) {
                        if (space.workflowReference?.name === symbol.name) {
                            references.push(...space.workflowReference.references);
                            const tasks = await space.workflowReference.getSymbolsOfType(TerminalSymbolWithReferences);
                            for (const task of tasks) {
                                if (task.name === symbol.name) {
                                    references.push(...task.references);
                                }
                            }
                        }
                    }
                }
            }
        }
        if (symbol instanceof SpaceSymbol && symbol.context) {
            const context = symbol.context;
            const identifier = context.IDENTIFIER?.();
            if (identifier) {
                references.push(new TerminalSymbolReference(identifier, symbol.document));
            }
        }
        return references;
    }
    isValidIdentifier(name) {
        if (!name || name.trim() !== name)
            return false;
        const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
        return identifierRegex.test(name);
    }
}
//# sourceMappingURL=RenamerProvider.js.map