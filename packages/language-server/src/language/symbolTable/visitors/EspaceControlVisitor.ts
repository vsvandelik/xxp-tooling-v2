import { ControlBlockScopeSymbol } from '../../../core/models/symbols/ControlBlockScopeSymbol.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { visitScopeSymbol } from '../helpers/SymbolHelpers.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import {
  EspaceControlBlockContext,
  EspaceControlBodyContext,
  EspaceSimpleTransitionContext,
  EspaceConditionalTransitionContext,
} from '@extremexp/core';

export class EspaceControlVisitor {
  constructor(private readonly builder: EspaceSymbolTableBuilder) {}

  public visitBlock(ctx: EspaceControlBlockContext): DocumentSymbolTable {
    const body = ctx.controlBody();
    if (!body) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    return this.visitBody(body);
  }

  public visitBody(ctx: EspaceControlBodyContext): DocumentSymbolTable {
    return visitScopeSymbol(this.builder, ControlBlockScopeSymbol, ctx) as DocumentSymbolTable;
  }

  public visitSimpleTransition(ctx: EspaceSimpleTransitionContext): DocumentSymbolTable {
    // Visit all control chain elements to find space name reads
    const chainElements = ctx.controlChainElement();
    for (const chainElement of chainElements) {
      const spaceName = chainElement.spaceNameRead();
      if (spaceName) {
        this.builder.visit(spaceName);
      }
    }

    return this.builder.defaultResult();
  }

  public visitConditionalTransition(ctx: EspaceConditionalTransitionContext): DocumentSymbolTable {
    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }
}
