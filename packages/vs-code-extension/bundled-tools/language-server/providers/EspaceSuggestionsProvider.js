import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { CompletionItemKind } from 'vscode-languageserver';
import { CodeCompletionCore } from 'antlr4-c3';
import { TaskSymbol } from '../core/models/symbols/TaskSymbol.js';
import { SpaceSymbol } from '../core/models/symbols/SpaceSymbol.js';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { ESPACEParser } from '@extremexp/core';
export class EspaceSuggestionsProvider extends Provider {
    logger = Logger.getLogger();
    static ignoredTokens = new Set([
        ESPACEParser.NUMBER,
        ESPACEParser.COMMENT,
        ESPACEParser.STRING,
    ]);
    static preferredRules = new Set([
        ESPACEParser.RULE_workflowNameRead,
        ESPACEParser.RULE_taskNameRead,
        ESPACEParser.RULE_spaceNameRead,
    ]);
    static visualSymbolsMap = new Map([
        [ESPACEParser.SEMICOLON, ';'],
        [ESPACEParser.ARROW, '->'],
        [ESPACEParser.CONDITION_ARROW, '-?>'],
        [ESPACEParser.LBRACE, '{'],
        [ESPACEParser.RBRACE, '}'],
        [ESPACEParser.LPAREN, '('],
        [ESPACEParser.RPAREN, ')'],
        [ESPACEParser.EQUALS, '='],
        [ESPACEParser.COMMA, ','],
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
        symbols.push(...(await this.processRules(candidates.rules, tokenPosition, folderSymbolTable, document.uri)));
        symbols.push(...this.processTokens(candidates.tokens, document.parser.vocabulary));
        return symbols;
    }
    ensureCodeCompletionCoreInitialized(document) {
        if (document.codeCompletionCore)
            return;
        const parser = document.parser;
        const core = new CodeCompletionCore(parser);
        core.ignoredTokens = EspaceSuggestionsProvider.ignoredTokens;
        core.preferredRules = EspaceSuggestionsProvider.preferredRules;
        document.codeCompletionCore = core;
    }
    async processRules(rules, position, symbolTable, documentUri) {
        const proposedSymbols = [];
        if (rules.has(ESPACEParser.RULE_workflowNameRead)) {
            await this.suggestWorkflowFiles(proposedSymbols, documentUri);
        }
        if (rules.has(ESPACEParser.RULE_taskNameRead)) {
            await this.suggestTasksFromReferencedWorkflow(position, proposedSymbols, symbolTable);
        }
        if (rules.has(ESPACEParser.RULE_spaceNameRead)) {
            await this.suggestAndStoreSymbols(position, SpaceSymbol, proposedSymbols, symbolTable, CompletionItemKind.Module);
        }
        return proposedSymbols;
    }
    processTokens(tokens, vocabulary) {
        const proposedSymbols = [];
        tokens.forEach((_, k) => {
            if (EspaceSuggestionsProvider.visualSymbolsMap.has(k)) {
                proposedSymbols.push({
                    label: EspaceSuggestionsProvider.visualSymbolsMap.get(k) || '',
                    kind: CompletionItemKind.Operator,
                });
            }
            else if (k !== ESPACEParser.IDENTIFIER) {
                const symbolicName = vocabulary.getSymbolicName(k);
                if (k === ESPACEParser.BOOLEAN) {
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
    async suggestAndStoreSymbols(position, type, proposedSymbols, symbolTable, kind) {
        (await symbolTable.getValidSymbolsAtPosition(position.parseTree, type)).forEach(s => {
            proposedSymbols.push({
                label: s,
                kind,
            });
        });
    }
    async suggestWorkflowFiles(proposedSymbols, documentUri) {
        const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(documentUri);
        if (folderSymbolTable) {
            const workflows = await folderSymbolTable.getSymbolsOfType(WorkflowSymbol);
            const addedWorkflows = new Set();
            workflows.forEach(workflow => {
                if (!addedWorkflows.has(workflow.name)) {
                    addedWorkflows.add(workflow.name);
                    proposedSymbols.push({
                        label: workflow.name,
                        kind: CompletionItemKind.Class,
                        detail: `Workflow defined in ${workflow.document.uri.split('/').pop()}`,
                    });
                }
            });
        }
    }
    async suggestTasksFromReferencedWorkflow(position, proposedSymbols, symbolTable) {
        const spaces = await symbolTable.getSymbolsOfType(SpaceSymbol);
        for (const space of spaces) {
            if (space.workflowReference) {
                const tasks = await space.workflowReference.getSymbolsOfType(TaskSymbol);
                tasks.forEach(task => {
                    proposedSymbols.push({
                        label: task.name,
                        kind: CompletionItemKind.Variable,
                        detail: `Task from ${space.workflowReference.name}`,
                    });
                });
            }
        }
    }
}
//# sourceMappingURL=EspaceSuggestionsProvider.js.map