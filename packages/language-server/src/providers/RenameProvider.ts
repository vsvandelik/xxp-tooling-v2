import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { RenameParams, WorkspaceEdit, TextEdit } from 'vscode-languageserver';
import { NavigationFeatures } from '../core/features/NavigationFeatures.js';

export class RenameProvider extends Provider {
  private logger = Logger.getInstance();
  private navigationFeatures = new NavigationFeatures();

  public addHandlers(): void {
    this.connection?.onRenameRequest(params => this.onRenameRequest(params));
  }

  private async onRenameRequest(params: RenameParams): Promise<WorkspaceEdit | null> {
    this.logger.info(
      `Received rename request for document: ${params.textDocument.uri}, new name: ${params.newName}`
    );

    const result = this.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return null;
    const [document, tokenPosition] = result;

    if (!this.isValidIdentifier(params.newName)) {
      this.logger.warn(`Invalid identifier for rename: ${params.newName}`);
      return null;
    }

    const references = await this.navigationFeatures.findReferences(document, tokenPosition, true);
    if (references.length === 0) return null;

    const changes: { [uri: string]: TextEdit[] } = {};

    for (const reference of references) {
      const uri = reference.uri;
      if (!changes[uri]) changes[uri] = [];
      changes[uri].push(TextEdit.replace(reference.range, params.newName));
    }

    return { changes };
  }

  private isValidIdentifier(name: string): boolean {
    if (!name || name.trim() !== name) return false;
    const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return identifierRegex.test(name);
  }
}
