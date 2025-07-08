import { BaseSymbol } from 'antlr4-c3';
import { ScopeSymbolWithSymbolReference } from './ScopeSymbolWithSymbolReference.js';
import { SpaceSymbol } from './SpaceSymbol.js';

export class SpaceScopeSymbol extends ScopeSymbolWithSymbolReference {
    override resolveSync(name: string, localOnly?: boolean): BaseSymbol | undefined {
        const symbol = super.resolveSync(name, localOnly);
        if (symbol) {
            return symbol;
        }

        const spaceSymbol = this.previousSibling;
        if (!spaceSymbol || !(spaceSymbol instanceof SpaceSymbol) || !(spaceSymbol as SpaceSymbol).workflowReference) {
            return undefined;
        }

        return (spaceSymbol as SpaceSymbol).workflowReference!.resolveSync(name, localOnly);
    }
}
