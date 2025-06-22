import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import {
    CompletionParams,
    CompletionItem,
    CompletionItemKind,
} from 'vscode-languageserver';
import { DataSymbol } from '../core/symbols/DataSymbol.js';
import { TaskSymbol } from '../core/symbols/TaskSymbol.js';
import { WorkflowSymbol } from '../core/symbols/WorkflowSymbol.js';
import { SpaceSymbol } from '../core/symbols/SpaceSymbol.js';
import { CodeCompletionCore } from 'antlr4-c3';

export class CompletionProvider extends Provider {
    private logger = Logger.getInstance();

    public addHandlers(): void {
        this.connection?.onCompletion(params => this.onCompletion(params));
        this.connection?.onCompletionResolve(item => this.onCompletionResolve(item));
    }

    private async onCompletion(params: CompletionParams): Promise<CompletionItem[] | null> {
        this.logger.info(`Received completion request for document: ${params.textDocument.uri}`);

        const result = this.getDocumentAndPosition(params.textDocument, params.position);
        if (!result) return null;
        const [document, tokenPosition] = result;

        if (!document.symbolTable) return null;

        const completionItems: CompletionItem[] = [];

        // Add symbol-based completions
        await this.addSymbolCompletions(document, completionItems);

        // Add keyword completions based on context
        this.addKeywordCompletions(document, tokenPosition, completionItems);

        return completionItems;
    }

    private async addSymbolCompletions(document: any, completionItems: CompletionItem[]): Promise<void> {
        if (!document.symbolTable) return;

        const allSymbols = await document.symbolTable.getAllNestedSymbols();

        for (const symbol of allSymbols) {
            if (symbol instanceof WorkflowSymbol) {
                completionItems.push({
                    label: symbol.name,
                    kind: CompletionItemKind.Class,
                    detail: 'Workflow',
                    documentation: `Workflow: ${symbol.name}`
                });
            } else if (symbol instanceof TaskSymbol) {
                completionItems.push({
                    label: symbol.name,
                    kind: CompletionItemKind.Function,
                    detail: 'Task',
                    documentation: `Task: ${symbol.name}`
                });
            } else if (symbol instanceof DataSymbol) {
                completionItems.push({
                    label: symbol.name,
                    kind: CompletionItemKind.Variable,
                    detail: 'Data',
                    documentation: `Data: ${symbol.name}`
                });
            } else if (symbol instanceof SpaceSymbol) {
                completionItems.push({
                    label: symbol.name,
                    kind: CompletionItemKind.Module,
                    detail: 'Space',
                    documentation: `Space: ${symbol.name} (${symbol.workflowName})`
                });
            }
        }
    }

    private addKeywordCompletions(document: any, tokenPosition: any, completionItems: CompletionItem[]): void {
        const uri = document.uri;
        
        if (uri.endsWith('.xxp')) {
            this.addXxpKeywords(completionItems);
        } else if (uri.endsWith('.espace')) {
            this.addEspaceKeywords(completionItems);
        }
    }

    private addXxpKeywords(completionItems: CompletionItem[]): void {
        const xxpKeywords = [
            'workflow', 'from', 'define', 'data', 'task', 'configure',
            'implementation', 'param', 'input', 'output', 'START', 'END'
        ];

        for (const keyword of xxpKeywords) {
            completionItems.push({
                label: keyword,
                kind: CompletionItemKind.Keyword,
                detail: 'XXP Keyword'
            });
        }
    }

    private addEspaceKeywords(completionItems: CompletionItem[]): void {
        const espaceKeywords = [
            'experiment', 'space', 'of', 'strategy', 'param', 'enum', 'range',
            'configure', 'task', 'control', 'condition', 'define', 'data',
            'gridsearch', 'randomsearch', 'START', 'END'
        ];

        for (const keyword of espaceKeywords) {
            completionItems.push({
                label: keyword,
                kind: CompletionItemKind.Keyword,
                detail: 'ESPACE Keyword'
            });
        }
    }

    private async onCompletionResolve(item: CompletionItem): Promise<CompletionItem> {
        this.logger.debug(`Resolving completion item: ${item.label}`);
        return item;
    }
}