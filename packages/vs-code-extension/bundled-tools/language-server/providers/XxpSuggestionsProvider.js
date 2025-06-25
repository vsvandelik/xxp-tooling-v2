import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { CompletionItemKind } from 'vscode-languageserver';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { CodeCompletionCore } from 'antlr4-c3';
import { DataSymbol } from '../core/models/symbols/DataSymbol.js';
import { TaskSymbol } from '../core/models/symbols/TaskSymbol.js';
import { XXPParser } from '@extremexp/core';
export class XxpSuggestionsProvider extends Provider {
    logger = Logger.getLogger();
    static ignoredTokens = new Set([
        XXPParser.NUMBER,
        XXPParser.COMMENT,
        XXPParser.STRING,
    ]);
    static preferredRules = new Set([
        XXPParser.RULE_workflowNameRead,
        XXPParser.RULE_dataNameRead,
        XXPParser.RULE_taskNameRead,
    ]);
    static visualSymbolsMap = new Map([
        [XXPParser.SEMICOLON, ';'],
        [XXPParser.ARROW, '->'],
        [XXPParser.LBRACE, '{'],
        [XXPParser.RBRACE, '}'],
        [XXPParser.EQUALS, '='],
    ]);
    addHandlers() { }
    async onCompletion(params) {
        this.logger.info(`Received completion request for document: ${params.textDocument.uri}`);
        const result = super.getDocumentAndPosition(params.textDocument, params.position);
        if (!result)
            return null;
        const [document, tokenPosition] = result;
        this.ensureCodeCompletionCoreInitialized(document);
        const candidates = document.codeCompletionCore.collectCandidates(tokenPosition.index);
        const symbols = [];
        const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(params.textDocument.uri);
        if (!folderSymbolTable) {
            this.logger.warn(`No folder symbol table found for ${params.textDocument.uri}`);
            return null;
        }
        await this.fixTokensSuggestionForChains(candidates.tokens, tokenPosition, document.tokenStream, folderSymbolTable);
        await this.fixRulesSuggestionForChains(candidates.rules, tokenPosition, document.tokenStream, folderSymbolTable);
        const inheritanceCompletions = await this.getWorkflowInheritanceCompletions(tokenPosition, document.tokenStream, folderSymbolTable);
        if (inheritanceCompletions.length > 0) {
            return inheritanceCompletions;
        }
        symbols.push(...(await this.processRules(candidates.rules, tokenPosition, folderSymbolTable, document.uri)));
        symbols.push(...this.processTokens(candidates.tokens, document.parser.vocabulary, tokenPosition, document.tokenStream));
        return symbols;
    }
    ensureCodeCompletionCoreInitialized(document) {
        if (document.codeCompletionCore)
            return;
        const parser = document.parser;
        const core = new CodeCompletionCore(parser);
        core.ignoredTokens = XxpSuggestionsProvider.ignoredTokens;
        core.preferredRules = XxpSuggestionsProvider.preferredRules;
        document.codeCompletionCore = core;
    }
    async processRules(rules, position, symbolTable, documentUri) {
        const proposedSymbols = [];
        if (rules.has(XXPParser.RULE_workflowNameRead)) {
            await this.suggestWorkflowNames(position, proposedSymbols, symbolTable, documentUri);
        }
        if (rules.has(XXPParser.RULE_dataNameRead)) {
            await this.suggestAndStoreSymbols(position, DataSymbol, proposedSymbols, symbolTable, CompletionItemKind.Variable);
        }
        if (rules.has(XXPParser.RULE_taskNameRead)) {
            await this.suggestAndStoreSymbols(position, TaskSymbol, proposedSymbols, symbolTable, CompletionItemKind.Variable);
        }
        return proposedSymbols;
    }
    getRuleName(ruleIndex) {
        const ruleNames = {
            [XXPParser.RULE_workflowNameRead]: 'workflowNameRead',
            [XXPParser.RULE_dataNameRead]: 'dataNameRead',
            [XXPParser.RULE_taskNameRead]: 'taskNameRead',
        };
        return ruleNames[ruleIndex] || `rule_${ruleIndex}`;
    }
    async fixTokensSuggestionForChains(tokens, position, tokenStream, symbolTable) {
        if (!tokens.has(XXPParser.ARROW)) {
            return;
        }
        const leftIdentifier = tokenStream.get(position.index - 1);
        const proposedDataIdentifiers = await symbolTable.getValidSymbolsAtPosition(position.parseTree, DataSymbol);
        if (leftIdentifier.text && proposedDataIdentifiers.includes(leftIdentifier.text)) {
            tokens.delete(XXPParser.ARROW);
        }
    }
    async fixRulesSuggestionForChains(rules, position, tokenStream, symbolTable) {
        if (!rules.has(XXPParser.RULE_dataNameRead) || !rules.has(XXPParser.RULE_taskNameRead)) {
            return;
        }
        const leftIdentifier = tokenStream.get(position.index - 3);
        const proposedDataIdentifiers = await symbolTable.getValidSymbolsAtPosition(position.parseTree, DataSymbol);
        if (leftIdentifier.text && proposedDataIdentifiers.includes(leftIdentifier.text)) {
            rules.delete(XXPParser.RULE_dataNameRead);
        }
        const proposedTaskIdentifiers = await symbolTable.getValidSymbolsAtPosition(position.parseTree, TaskSymbol);
        if (leftIdentifier.text && proposedTaskIdentifiers.includes(leftIdentifier.text)) {
            rules.delete(XXPParser.RULE_taskNameRead);
        }
    }
    processTokens(tokens, vocabulary, tokenPosition, tokenStream) {
        const proposedSymbols = [];
        tokens.forEach((_, k) => {
            if (XxpSuggestionsProvider.visualSymbolsMap.has(k)) {
                proposedSymbols.push({
                    label: XxpSuggestionsProvider.visualSymbolsMap.get(k) || '',
                    kind: CompletionItemKind.Operator,
                });
            }
            else if (k !== XXPParser.IDENTIFIER) {
                const symbolicName = vocabulary.getSymbolicName(k);
                if (symbolicName === 'START' || symbolicName === 'END') {
                    if (symbolicName === 'START' && tokenPosition && tokenStream && this.isAfterStartInChain(tokenPosition, tokenStream)) {
                        return;
                    }
                    proposedSymbols.push({
                        label: symbolicName,
                        kind: CompletionItemKind.Keyword,
                    });
                }
                else if (k === XXPParser.BOOLEAN) {
                    proposedSymbols.push({
                        label: 'true',
                        kind: CompletionItemKind.Value,
                    });
                    proposedSymbols.push({
                        label: 'false',
                        kind: CompletionItemKind.Value,
                    });
                }
                else if (symbolicName) {
                    proposedSymbols.push({
                        label: symbolicName.toLowerCase(),
                        kind: CompletionItemKind.Keyword,
                    });
                }
            }
        });
        return proposedSymbols;
    }
    isAfterStartInChain(position, tokenStream) {
        let index = position.index - 1;
        while (index >= 0) {
            const token = tokenStream.get(index);
            if (token.type === XXPParser.WS) {
                index--;
                continue;
            }
            if (token.type === XXPParser.ARROW) {
                index--;
                while (index >= 0) {
                    const prevToken = tokenStream.get(index);
                    if (prevToken.type === XXPParser.WS) {
                        index--;
                        continue;
                    }
                    if (prevToken.type === XXPParser.START) {
                        return true;
                    }
                    break;
                }
            }
            break;
        }
        return false;
    }
    async suggestWorkflowNames(position, proposedSymbols, symbolTable, documentUri) {
        const validWorkflows = await symbolTable.getValidSymbolsAtPosition(position.parseTree, WorkflowSymbol);
        const currentWorkflowName = this.getWorkflowNameFromDocument(position);
        const filteredWorkflows = currentWorkflowName
            ? validWorkflows.filter(name => name !== currentWorkflowName)
            : validWorkflows;
        filteredWorkflows.forEach(workflowName => {
            proposedSymbols.push({
                label: workflowName,
                kind: CompletionItemKind.Class,
            });
        });
    }
    async suggestAndStoreSymbols(position, type, proposedSymbols, symbolTable, kind) {
        const validSymbols = await symbolTable.getValidSymbolsAtPosition(position.parseTree, type);
        const filteredSymbols = type.name === 'WorkflowSymbol'
            ? this.filterOutCurrentWorkflow(validSymbols, position)
            : validSymbols;
        filteredSymbols.forEach(s => {
            proposedSymbols.push({
                label: s,
                kind,
            });
        });
    }
    filterOutCurrentWorkflow(workflowNames, position) {
        const currentWorkflowName = this.getWorkflowNameFromDocument(position);
        if (currentWorkflowName) {
            return workflowNames.filter(name => name !== currentWorkflowName);
        }
        return workflowNames;
    }
    getWorkflowNameFromDocument(position) {
        const rootNode = this.getRootNode(position.parseTree);
        if (rootNode && rootNode.start && rootNode.start.inputStream) {
            try {
                let fullText = null;
                if (rootNode.start.inputStream.getText) {
                    fullText = rootNode.start.inputStream.getText(0, rootNode.start.inputStream.size - 1);
                }
                else if (rootNode.start.inputStream.toString) {
                    fullText = rootNode.start.inputStream.toString();
                }
                else if (rootNode.getText) {
                    fullText = rootNode.getText();
                }
                if (fullText) {
                    const match = fullText.match(/workflow\s+(\w+)/);
                    if (match && match[1]) {
                        return match[1];
                    }
                }
            }
            catch (error) {
            }
        }
        return null;
    }
    getRootNode(node) {
        let currentNode = node;
        while (currentNode && currentNode.parent) {
            currentNode = currentNode.parent;
        }
        return currentNode;
    }
    async getWorkflowInheritanceCompletions(position, tokenStream, symbolTable) {
        if (!this.isAfterFromKeywordInWorkflowHeader(position, tokenStream)) {
            return [];
        }
        const allWorkflows = await symbolTable.getValidSymbolsAtPosition(position.parseTree, WorkflowSymbol);
        const currentWorkflowName = this.getWorkflowNameFromDocument(position);
        const availableWorkflows = currentWorkflowName
            ? allWorkflows.filter(name => name !== currentWorkflowName)
            : allWorkflows;
        return availableWorkflows.map(workflowName => ({
            label: workflowName,
            kind: CompletionItemKind.Class,
            detail: 'Workflow'
        }));
    }
    isAfterFromKeywordInWorkflowHeader(position, tokenStream) {
        let index = position.index - 1;
        while (index >= 0) {
            const token = tokenStream.get(index);
            if (token.type === XXPParser.WS) {
                index--;
                continue;
            }
            if (token.type === XXPParser.FROM) {
                return this.isInWorkflowHeader(index, tokenStream);
            }
            break;
        }
        return false;
    }
    isInWorkflowHeader(fromTokenIndex, tokenStream) {
        let index = fromTokenIndex - 1;
        let foundIdentifier = false;
        while (index >= 0) {
            const token = tokenStream.get(index);
            if (token.type === XXPParser.WS) {
                index--;
                continue;
            }
            if (token.type === XXPParser.IDENTIFIER && !foundIdentifier) {
                foundIdentifier = true;
                index--;
                continue;
            }
            if (token.type === XXPParser.WORKFLOW && foundIdentifier) {
                return true;
            }
            break;
        }
        return false;
    }
}
//# sourceMappingURL=XxpSuggestionsProvider.js.map