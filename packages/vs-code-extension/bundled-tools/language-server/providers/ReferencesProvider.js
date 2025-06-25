import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { Range } from 'vscode-languageserver';
import { TerminalSymbolWithReferences } from '../core/models/symbols/TerminalSymbolWithReferences.js';
import { RangeUtils } from '../utils/RangeUtils.js';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { ExperimentSymbol } from '../core/models/symbols/ExperimentSymbol.js';
import { SpaceSymbol } from '../core/models/symbols/SpaceSymbol.js';
import { XxpWorkflowNameReadContext, EspaceWorkflowNameReadContext, EspaceTaskNameReadContext, EspaceSpaceNameReadContext, } from '@extremexp/core';
import { TerminalNode } from 'antlr4ng';
export class ReferencesProvider extends Provider {
    logger = Logger.getLogger();
    addHandlers() {
        this.connection.onReferences(referenceParams => this.onReferences(referenceParams));
        this.connection.onDefinition(tokenPosition => this.onDefinition(tokenPosition));
    }
    async onReferences(params) {
        this.logger.info(`Received references request for document: ${params.textDocument.uri}`);
        const result = super.getDocumentAndPosition(params.textDocument, params.position);
        if (!result)
            return Promise.resolve(null);
        const [document, tokenPosition] = result;
        const symbol = await this.resolveSymbol(document, tokenPosition);
        if (!symbol)
            return null;
        const locations = await this.getAllReferences(symbol);
        if (params.context.includeDeclaration && this.hasDeclaration(symbol)) {
            const definitionLocation = this.getLocationFromDeclaration(symbol);
            if (definitionLocation)
                locations.push(definitionLocation);
        }
        return locations;
    }
    async onDefinition(params) {
        const result = super.getDocumentAndPosition(params.textDocument, params.position);
        if (!result)
            return Promise.resolve(null);
        const [document, tokenPosition] = result;
        const symbol = await this.resolveSymbol(document, tokenPosition);
        if (!symbol || !this.hasDeclaration(symbol))
            return null;
        return this.getLocationFromDeclaration(symbol);
    }
    async resolveSymbol(document, tokenPosition) {
        if (tokenPosition.parseTree instanceof XxpWorkflowNameReadContext ||
            tokenPosition.parseTree instanceof EspaceWorkflowNameReadContext) {
            const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(document.uri);
            const result = (await folderSymbolTable?.resolve(tokenPosition.text, false)) || null;
            return result;
        }
        if (tokenPosition.parseTree instanceof EspaceSpaceNameReadContext) {
            const experimentSymbol = document.symbolTable?.children.find((c) => c instanceof ExperimentSymbol);
            if (experimentSymbol) {
                const result = (await experimentSymbol.resolve(tokenPosition.text, false)) || null;
                return result;
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
    async getAllReferences(symbol) {
        const references = [];
        if (symbol instanceof TerminalSymbolWithReferences ||
            symbol instanceof WorkflowSymbol ||
            symbol instanceof ExperimentSymbol) {
            references.push(...symbol.references);
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
                        }
                    }
                }
            }
        }
        return this.getLocationsFromReferences(references);
    }
    hasDeclaration(symbol) {
        if (!symbol) {
            return false;
        }
        if (symbol instanceof TerminalSymbolWithReferences ||
            symbol instanceof WorkflowSymbol ||
            symbol instanceof ExperimentSymbol) {
            return symbol.context !== undefined;
        }
        return false;
    }
    getLocationsFromReferences(references) {
        return references.map(ref => ({
            uri: ref.document.uri,
            range: Range.create(ref.node.symbol.line - 1, ref.node.symbol.column, ref.node.symbol.line - 1, ref.node.symbol.column + ref.node.getText().length),
        }));
    }
    getLocationFromDeclaration(symbol) {
        if (!(symbol instanceof TerminalSymbolWithReferences ||
            symbol instanceof WorkflowSymbol ||
            symbol instanceof ExperimentSymbol)) {
            return undefined;
        }
        const parseTree = symbol.context;
        if (!parseTree) {
            return undefined;
        }
        let identifierNode = null;
        for (let i = 0; i < parseTree.getChildCount(); i++) {
            const child = parseTree.getChild(i);
            const isTerminalNode = child?.constructor?.name === 'TerminalNode' || child instanceof TerminalNode;
            const textMatches = child?.getText() === symbol.name;
            if (isTerminalNode && textMatches) {
                identifierNode = child;
                break;
            }
        }
        if (!identifierNode) {
            return undefined;
        }
        let definitionRange = RangeUtils.getRangeFromParseTree(identifierNode);
        if (!definitionRange && identifierNode.symbol) {
            definitionRange = Range.create(identifierNode.symbol.line - 1, identifierNode.symbol.column, identifierNode.symbol.line - 1, identifierNode.symbol.column + identifierNode.getText().length);
        }
        if (!definitionRange)
            return undefined;
        return {
            uri: symbol.document.uri,
            range: definitionRange,
        };
    }
}
//# sourceMappingURL=ReferencesProvider.js.map