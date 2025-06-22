import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import {
    RenameParams,
    WorkspaceEdit,
    TextEdit
} from 'vscode-languageserver';
import { RangeUtils } from '../utils/RangeUtils.js';

export class RenameProvider extends Provider {
    private logger = Logger.getInstance();

    public addHandlers(): void {
        this.connection?.onRenameRequest(params => this.onRenameRequest(params));
    }

    private async onRenameRequest(params: RenameParams): Promise<WorkspaceEdit | null> {
        this.logger.info(`Received rename request for document: ${params.textDocument.uri}, new name: ${params.newName}`);

        const result = this.getDocumentAndPosition(params.textDocument, params.position);
        if (!result) return null;
        const [document, tokenPosition] = result;

        if (!this.isValidIdentifier(params.newName)) {
            this.logger.warn(`Invalid identifier for rename: ${params.newName}`);
            return null;
        }

        const symbol = await this.findSymbolAtPosition(document, tokenPosition.text);
        if (!symbol || !symbol.context) return null;

        const changes: { [uri: string]: TextEdit[] } = {};

        // Add declaration location
        const declarationRange = RangeUtils.getRangeFromParseTree(symbol.context);
        if (declarationRange) {
            const uri = symbol.document.uri;
            if (!changes[uri]) changes[uri] = [];
            changes[uri].push(TextEdit.replace(declarationRange, params.newName));
        }

        // Add all reference locations
        if (symbol.references) {
            for (const reference of symbol.references) {
                const range = RangeUtils.getRangeFromParseTree(reference.node);
                if (!range) continue;

                const uri = reference.document.uri;
                if (!changes[uri]) changes[uri] = [];
                changes[uri].push(TextEdit.replace(range, params.newName));
            }
        }

        return { changes };
    }

    private async findSymbolAtPosition(document: any, text: string): Promise<any> {
        if (!document.symbolTable) return undefined;

        const allSymbols = await document.symbolTable.getAllNestedSymbols();
        return allSymbols.find((symbol: any) => symbol.name === text);
    }

    private isValidIdentifier(name: string): boolean {
        if (!name || name.trim() !== name) return false;
        const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
        return identifierRegex.test(name);
    }
}