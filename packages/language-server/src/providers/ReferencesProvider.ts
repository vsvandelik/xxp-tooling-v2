import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { ReferenceParams, Location } from 'vscode-languageserver';
import { NavigationFeatures } from '../core/features/NavigationFeatures.js';

export class ReferencesProvider extends Provider {
  private logger = Logger.getInstance();
  private navigationFeatures = new NavigationFeatures();

  public addHandlers(): void {
    this.connection?.onReferences(params => this.onReferences(params));
  }

  private async onReferences(params: ReferenceParams): Promise<Location[] | null> {
    this.logger.info(`Received references request for document: ${params.textDocument.uri}`);

    const result = this.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return null;
    const [document, tokenPosition] = result;

    return this.navigationFeatures.findReferences(
      document, 
      tokenPosition, 
      params.context.includeDeclaration
    );
  }
}
