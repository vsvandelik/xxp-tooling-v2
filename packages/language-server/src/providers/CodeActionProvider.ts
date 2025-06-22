import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { CodeActionParams, CodeAction } from 'vscode-languageserver';
import { CodeActions } from '../core/features/CodeActions.js';

export class CodeActionProvider extends Provider {
  private logger = Logger.getInstance();
  private codeActions = new CodeActions();

  public addHandlers(): void {
    this.connection?.onCodeAction(params => this.onCodeAction(params));
  }

  private async onCodeAction(params: CodeActionParams): Promise<CodeAction[] | null> {
    this.logger.info(`Received code action request for document: ${params.textDocument.uri}`);

    // For each diagnostic in the range, get code actions
    const actions: CodeAction[] = [];

    for (const diagnostic of params.context.diagnostics) {
      const result = this.getDocumentAndPosition(params.textDocument, diagnostic.range.start);
      if (!result) continue;
      const [document, tokenPosition] = result;

      const diagnosticActions = await this.codeActions.getCodeActions(document, tokenPosition);
      actions.push(...diagnosticActions);
    }

    return actions.length > 0 ? actions : null;
  }
}
