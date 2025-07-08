import { SpaceSymbol } from '../../../core/models/symbols/SpaceSymbol.js';
import { SpaceScopeSymbol } from '../../../core/models/symbols/SpaceScopeSymbol.js';
import { DocumentSymbolTable } from '../DocumentSymbolTable.js';
import { addSymbolOfTypeWithContext, visitScopeSymbol } from '../helpers/SymbolHelpers.js';
import { addDiagnostic } from '../helpers/Diagnostics.js';
import { EspaceSymbolTableBuilder } from '../builders/EspaceSymbolTableBuilder.js';
import { WorkflowSymbol } from '../../../core/models/symbols/WorkflowSymbol.js';
import { FileUtils } from '../../../utils/FileUtils.js';
import { Document } from '../../../core/documents/Document.js';
import {
  EspaceSpaceDeclarationContext,
  EspaceSpaceHeaderContext,
  EspaceSpaceBodyContext,
  EspaceStrategyStatementContext,
} from '@extremexp/core';

export class EspaceSpaceVisitor {
  constructor(private readonly builder: EspaceSymbolTableBuilder) {}

  public visitDeclaration(ctx: EspaceSpaceDeclarationContext): DocumentSymbolTable {
    const header = ctx.spaceHeader();
    const body = ctx.spaceBody();

    if (!header || !body) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    // Visit header to create the space symbol
    this.builder.visit(header);

    // Visit body in the context of the space
    this.builder.visit(body);

    return this.builder.defaultResult();
  }

  public visitHeader(ctx: EspaceSpaceHeaderContext): DocumentSymbolTable {
    const identifier = ctx.IDENTIFIER();
    const workflowNameRead = ctx.workflowNameRead();

    if (!identifier || !workflowNameRead) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    const spaceName = identifier.getText();
    const workflowName = workflowNameRead.getText();

    console.error(`[SPACE] SPACE-HEADER-START: space="${spaceName}", workflow="${workflowName}"`);

    // Get the referenced workflow
    const workflowDocument = this.getWorkflowDocument(workflowName);
    let workflowSymbol: WorkflowSymbol | undefined;

    console.error(`[SPACE] SPACE-DOC-FOUND: ${!!workflowDocument}`);

    if (!workflowDocument) {
      console.error(`[SPACE] SPACE-DOC-NOT-FOUND: "${workflowName}"`);
      addDiagnostic(this.builder, workflowNameRead, `Workflow '${workflowName}' not found`);
    } else {
      console.error(`[SPACE] SPACE-RESOLVE-WF: "${workflowName}"`);
      workflowSymbol = workflowDocument.symbolTable?.resolveSync(workflowName) as WorkflowSymbol;

      console.error(`[SPACE] SPACE-WF-RESOLVED: ${!!workflowSymbol}`);

      if (!workflowSymbol) {
        console.error(`[SPACE] SPACE-WF-NOT-IN-DOC: "${workflowName}"`);
        addDiagnostic(
          this.builder,
          workflowNameRead,
          `Workflow '${workflowName}' is not defined in the referenced file`
        );
      } else {
        console.error(`[SPACE] SPACE-WF-SUCCESS: "${workflowSymbol.name}"`);
        Document.addDocumentDependency(this.builder.document, workflowDocument);
      }
    }

    // Create the space symbol
    console.error(`[SPACE] SPACE-CREATE: "${spaceName}" with-ref=${!!workflowSymbol}`);
    const spaceSymbol = addSymbolOfTypeWithContext(
      this.builder,
      SpaceSymbol,
      spaceName,
      ctx,
      this.builder.currentScope,
      this.builder.document,
      workflowSymbol
    );

    if (!spaceSymbol) {
      console.error(`[SPACE] SPACE-CREATE-FAILED: "${spaceName}"`);
      return this.builder.defaultResult();
    }

    console.error(`[SPACE] SPACE-CREATED: "${spaceSymbol.name}" ref="${spaceSymbol.workflowReference?.name}"`);

    workflowSymbol?.addSpaceReference(spaceSymbol);
    // Visit the workflow name read to add reference
    this.builder.visit(workflowNameRead);

    return this.builder.defaultResult();
  }

  public visitBody(ctx: EspaceSpaceBodyContext): DocumentSymbolTable {
    // Find the space symbol created in the header
    const spaceSymbol = this.findSpaceSymbolForBody(ctx);
    if (!spaceSymbol) {
      return this.builder.visitChildren(ctx) as DocumentSymbolTable;
    }

    // Create a scope for the space body
    return visitScopeSymbol(
      this.builder,
      SpaceScopeSymbol,
      ctx,
      spaceSymbol
    ) as DocumentSymbolTable;
  }

  public visitStrategy(ctx: EspaceStrategyStatementContext): DocumentSymbolTable {
    const strategyName = ctx.getText();

    // Find the parent space symbol
    const spaceScope = this.findParentSpaceScope();
    if (spaceScope && spaceScope.symbolReference instanceof SpaceSymbol) {
      spaceScope.symbolReference.strategy = strategyName;
    }

    return this.builder.visitChildren(ctx) as DocumentSymbolTable;
  }

  private getWorkflowDocument(workflowName: string): Document | undefined {
    const workflowFileName = FileUtils.getWorkflowFileFromWorkflowName(workflowName);
    const workflowUri = this.builder.document.uri.replace(/[^/\\]+$/, workflowFileName);
    return this.builder.documentsManager.getDocumentAndLoadIfNecessary(workflowUri);
  }

  private findSpaceSymbolForBody(ctx: EspaceSpaceBodyContext): SpaceSymbol | undefined {
    // The space declaration is the parent, and the header is a sibling
    const declaration = ctx.parent;
    if (!declaration) return undefined;

    // Look for the space symbol in the current scope
    const spaces = this.builder.currentScope.getNestedSymbolsOfTypeSync(SpaceSymbol);
    return spaces[spaces.length - 1]; // Get the most recently added space
  }

  private findParentSpaceScope(): SpaceScopeSymbol | undefined {
    if (this.builder.currentScope instanceof SpaceScopeSymbol) {
      return this.builder.currentScope;
    }
    return undefined;
  }
}
