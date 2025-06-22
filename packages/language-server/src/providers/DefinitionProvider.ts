import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { DefinitionParams, Location } from 'vscode-languageserver';
import { NavigationFeatures } from '../core/features/NavigationFeatures.js';

export class DefinitionProvider extends Provider {
  private logger = Logger.getInstance();
  private navigationFeatures = new NavigationFeatures();

  public addHandlers(): void {
    this.connection?.onDefinition(params => this.onDefinition(params));
  }

  private async onDefinition(params: DefinitionParams): Promise<Location | null> {
    this.logger.info(`Received definition request for document: ${params.textDocument.uri}`);

    const result = this.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return null;
    const [document, tokenPosition] = result;

    return this.navigationFeatures.findDefinition(document, tokenPosition);
  }
}
