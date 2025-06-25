import { Provider } from './Provider.js';
import { Location, DefinitionParams } from 'vscode-languageserver';
export declare class ReferencesProvider extends Provider {
    private logger;
    addHandlers(): void;
    private onReferences;
    onDefinition(params: DefinitionParams): Promise<Location | null | undefined>;
    private resolveSymbol;
    private getAllReferences;
    private hasDeclaration;
    private getLocationsFromReferences;
    private getLocationFromDeclaration;
}
//# sourceMappingURL=ReferencesProvider.d.ts.map