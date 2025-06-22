import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { ReferenceParams, Location, Range, DefinitionParams } from 'vscode-languageserver';
import { TerminalSymbolWithReferences } from '../core/models/symbols/TerminalSymbolWithReferences.js';
import { RangeUtils } from '../utils/RangeUtils.js';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { TerminalSymbolReference } from '../core/models/TerminalSymbolReference.js';
import { WorkflowNameReadContext } from '@extremexp/core/src/language/generated/XXPParser.js';

export class ReferencesProvider extends Provider {
  private logger = Logger.getLogger();

  addHandlers(): void {
    this.connection!.onReferences(referenceParams => this.onReferences(referenceParams));
    this.connection!.onDefinition(tokenPosition => this.onDefinition(tokenPosition));
  }

  private async onReferences(params: ReferenceParams): Promise<Location[] | null> {
    this.logger.info(`Received references request for document: ${params.textDocument.uri}`);

    const result = super.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return Promise.resolve(null);
    const [document, tokenPosition] = result;

    let symbol: TerminalSymbolWithReferences | WorkflowSymbol;

    if (tokenPosition.parseTree instanceof WorkflowNameReadContext) {
      const folderSymbolTable = document.workflowSymbolTable?.parent;
      const workflowSymbol = await folderSymbolTable?.resolve(tokenPosition.text, true);
      if (!(workflowSymbol instanceof WorkflowSymbol)) return null;
      symbol = workflowSymbol;
    } else {
      const terminalSymbol = await document.workflowSymbolTable?.resolve(tokenPosition.text, true);
      if (!(terminalSymbol instanceof TerminalSymbolWithReferences)) return null;
      symbol = terminalSymbol;
    }

    const locations = this.getLocationsFromReferences(symbol.references);

    if (params.context.includeDeclaration && symbol.context) {
      const definitionLocation = this.getLocationFromDeclaration(symbol);
      if (definitionLocation) locations.push(definitionLocation);
    }

    return locations;
  }

  public async onDefinition(params: DefinitionParams): Promise<Location | null | undefined> {
    this.logger.info(`Received definition request for document: ${params.textDocument.uri}`);

    const result = super.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return Promise.resolve(null);
    const [document, tokenPosition] = result;

    let defitionSymbol: TerminalSymbolWithReferences | WorkflowSymbol;

    if (tokenPosition.parseTree instanceof WorkflowNameReadContext) {
      const folderSymbolTable = document.workflowSymbolTable?.parent;
      const workflowSymbol = await folderSymbolTable?.resolve(tokenPosition.text, true);
      if (!(workflowSymbol instanceof WorkflowSymbol)) return null;
      defitionSymbol = workflowSymbol;
    } else {
      const terminalSymbol = await document.workflowSymbolTable?.resolve(tokenPosition.text, true);
      if (!(terminalSymbol instanceof TerminalSymbolWithReferences)) return null;
      defitionSymbol = terminalSymbol;
    }

    if (!defitionSymbol.context) return null;
    return this.getLocationFromDeclaration(defitionSymbol);
  }

  private getLocationsFromReferences(references: TerminalSymbolReference[]): Location[] {
    return references.map(ref => ({
      uri: ref.document.uri,
      range: Range.create(
        ref.node.symbol.line - 1,
        ref.node.symbol.column,
        ref.node.symbol.line - 1,
        ref.node.symbol.column + ref.node.getText().length
      ),
    }));
  }

  private getLocationFromDeclaration(
    symbol: TerminalSymbolWithReferences | WorkflowSymbol
  ): Location | undefined {
    const parseTree =
      symbol instanceof TerminalSymbolWithReferences ? symbol.context : symbol.context?.getChild(0);
    const definitionRange = RangeUtils.getRangeFromParseTree(parseTree!);
    if (!definitionRange) return undefined;

    return {
      uri: symbol.document.uri,
      range: definitionRange,
    };
  }
}
