import { Provider } from './Provider.js';
import { Logger } from '../utils/Logger.js';
import { ReferenceParams, Location, Range, DefinitionParams } from 'vscode-languageserver';
import { TerminalSymbolWithReferences } from '../core/models/symbols/TerminalSymbolWithReferences.js';
import { RangeUtils } from '../utils/RangeUtils.js';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { ExperimentSymbol } from '../core/models/symbols/ExperimentSymbol.js';
import { TerminalSymbolReference } from '../core/models/TerminalSymbolReference.js';
import { SpaceSymbol } from '../core/models/symbols/SpaceSymbol.js';
import {
  XxpWorkflowNameReadContext,
  XxpWorkflowHeaderContext,
  XxpTaskDefinitionContext,
  XxpDataDefinitionContext,
  XxpParamAssignmentContext,
  EspaceWorkflowNameReadContext,
  EspaceTaskNameReadContext,
  EspaceSpaceNameReadContext,
  EspaceExperimentHeaderContext,
  EspaceSpaceHeaderContext,
  EspaceParamDefinitionContext,
} from '@extremexp/core';
import { BaseSymbol } from 'antlr4-c3';
import { TerminalNode } from 'antlr4ng';

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

    const symbol = await this.resolveSymbol(document, tokenPosition);
    if (!symbol) return null;

    const locations = await this.getAllReferences(symbol);

    if (params.context.includeDeclaration && this.hasDeclaration(symbol)) {
      const definitionLocation = this.getLocationFromDeclaration(symbol);
      if (definitionLocation) locations.push(definitionLocation);
    }

    return locations;
  }

  public async onDefinition(params: DefinitionParams): Promise<Location | null | undefined> {
    const result = super.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) return Promise.resolve(null);
    const [document, tokenPosition] = result;

    const symbol = await this.resolveSymbol(document, tokenPosition);
    if (!symbol || !this.hasDeclaration(symbol)) return null;

    return this.getLocationFromDeclaration(symbol);
  }

  private async resolveSymbol(document: any, tokenPosition: any): Promise<BaseSymbol | null> {
    // Handle workflow header contexts (definitions)
    if (tokenPosition.parseTree instanceof XxpWorkflowHeaderContext) {
      // Try multiple symbol tables for workflow definitions
      if (document.symbolTable) {
        const result = await document.symbolTable.resolve(tokenPosition.text, false);
        if (result) return result;
      }
      if (document.workflowSymbolTable) {
        const result = await document.workflowSymbolTable.resolve(tokenPosition.text, false);
        if (result) return result;
      }
      // Try folder symbol table as fallback
      const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(document.uri);
      if (folderSymbolTable) {
        const result = await folderSymbolTable.resolve(tokenPosition.text, false);
        if (result) return result;
      }
    }

    // Handle task definition contexts
    if (tokenPosition.parseTree instanceof XxpTaskDefinitionContext) {
      // For task definitions, look in the workflow symbol table
      if (document.workflowSymbolTable) {
        return (await document.workflowSymbolTable.resolve(tokenPosition.text, false)) || null;
      }
    }

    // Handle data definition contexts
    if (tokenPosition.parseTree instanceof XxpDataDefinitionContext) {
      // For data definitions, look in the workflow symbol table
      if (document.workflowSymbolTable) {
        return (await document.workflowSymbolTable.resolve(tokenPosition.text, false)) || null;
      }
    }

    // Handle parameter assignment contexts
    if (tokenPosition.parseTree instanceof XxpParamAssignmentContext) {
      // For param assignments, look in the workflow symbol table
      if (document.workflowSymbolTable) {
        return (await document.workflowSymbolTable.resolve(tokenPosition.text, false)) || null;
      }
    }

    // Handle experiment header contexts (ESPACE definitions)
    if (tokenPosition.parseTree instanceof EspaceExperimentHeaderContext) {
      // For experiment definitions, look in the document's symbol table
      if (document.symbolTable) {
        return (await document.symbolTable.resolve(tokenPosition.text, false)) || null;
      }
    }

    // Handle space header contexts (ESPACE space definitions)
    if (tokenPosition.parseTree instanceof EspaceSpaceHeaderContext) {
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        return (await experimentSymbol.resolve(tokenPosition.text, false)) || null;
      }
    }

    // Handle parameter definition contexts (ESPACE)
    if (tokenPosition.parseTree instanceof EspaceParamDefinitionContext) {
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        return (await experimentSymbol.resolve(tokenPosition.text, false)) || null;
      }
    }

    // Handle workflow references (usage, not definition)
    if (
      tokenPosition.parseTree instanceof XxpWorkflowNameReadContext ||
      tokenPosition.parseTree instanceof EspaceWorkflowNameReadContext
    ) {
      // For workflow references, look in the folder symbol table
      const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(document.uri);
      return (await folderSymbolTable?.resolve(tokenPosition.text, false)) || null;
    }

    // Handle space references in ESPACE files
    if (tokenPosition.parseTree instanceof EspaceSpaceNameReadContext) {
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        return (await experimentSymbol.resolve(tokenPosition.text, false)) || null;
      }
    }

    // Handle task references in ESPACE files
    if (tokenPosition.parseTree instanceof EspaceTaskNameReadContext) {
      // First try local resolution
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        const localSymbol = await experimentSymbol.resolve(tokenPosition.text, true);
        if (localSymbol) return localSymbol;

        // If not found locally, search in referenced workflows
        const spaces = await experimentSymbol.getSymbolsOfType(SpaceSymbol);
        for (const space of spaces) {
          if (space.workflowReference) {
            const workflowSymbol = await space.workflowReference.resolve(tokenPosition.text, false);
            if (workflowSymbol) return workflowSymbol;
          }
        }
      }
    }

    // Default resolution for other symbols - try all symbol tables
    // First try workflow symbol table
    if (document.workflowSymbolTable) {
      const result = await document.workflowSymbolTable.resolve(tokenPosition.text, false);
      if (result) return result;
    }
    
    // Then try document symbol table
    if (document.symbolTable) {
      const result = await document.symbolTable.resolve(tokenPosition.text, false);
      if (result) return result;
    }
    
    // Finally try folder symbol table
    const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(document.uri);
    if (folderSymbolTable) {
      const result = await folderSymbolTable.resolve(tokenPosition.text, false);
      if (result) return result;
    }

    return null;
  }

  private async getAllReferences(symbol: BaseSymbol): Promise<Location[]> {
    const references: TerminalSymbolReference[] = [];

    if (
      symbol instanceof TerminalSymbolWithReferences ||
      symbol instanceof WorkflowSymbol ||
      symbol instanceof ExperimentSymbol
    ) {
      references.push(...symbol.references);
    }

    // For workflow symbols, also check in ESPACE files
    if (symbol instanceof WorkflowSymbol) {
      const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(
        symbol.document.uri
      );
      if (folderSymbolTable) {
        // Find all experiment symbols that might reference this workflow
        const experiments = await folderSymbolTable.getSymbolsOfType(ExperimentSymbol);
        for (const experiment of experiments) {
          const spaces = await experiment.getSymbolsOfType(SpaceSymbol);
          for (const space of spaces) {
            if (space.workflowReference?.name === symbol.name) {
              references.push(...space.workflowReference.references);
            }
          }
        }
      }
    }

    return this.getLocationsFromReferences(references);
  }

  private hasDeclaration(symbol: BaseSymbol): boolean {
    if (!symbol) {
      return false;
    }

    if (
      symbol instanceof TerminalSymbolWithReferences ||
      symbol instanceof WorkflowSymbol ||
      symbol instanceof ExperimentSymbol
    ) {
      return symbol.context !== undefined;
    }
    return false;
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

  private getLocationFromDeclaration(symbol: BaseSymbol): Location | undefined {
    if (
      !(
        symbol instanceof TerminalSymbolWithReferences ||
        symbol instanceof WorkflowSymbol ||
        symbol instanceof ExperimentSymbol
      )
    ) {
      return undefined;
    }

    const parseTree = symbol.context;
    if (!parseTree) {
      return undefined;
    }

    // Find the identifier node using context-specific approach
    let identifierNode: TerminalNode | null = this.getIdentifierFromContext(parseTree, symbol.name);
    
    if (!identifierNode) {
      return undefined;
    }

    // Try RangeUtils first, fallback to manual range creation
    let definitionRange = RangeUtils.getRangeFromParseTree(identifierNode);
    
    if (!definitionRange && identifierNode.symbol) {
      definitionRange = Range.create(
        identifierNode.symbol.line - 1,
        identifierNode.symbol.column,
        identifierNode.symbol.line - 1,
        identifierNode.symbol.column + identifierNode.getText().length
      );
    }
    
    if (!definitionRange) return undefined;

    return {
      uri: symbol.document.uri,
      range: definitionRange,
    };
  }

  private getIdentifierFromContext(parseTree: any, symbolName: string): TerminalNode | null {
    const contextName = parseTree.constructor.name;
    
    // Context-specific identifier resolution based on grammar structure
    switch (contextName) {
      case 'WorkflowHeaderContext':
        // workflowHeader: WORKFLOW IDENTIFIER (FROM workflowNameRead)?
        // IDENTIFIER is at position 1
        return this.getIdentifierAtPosition(parseTree, 1, symbolName);
        
      case 'TaskDefinitionContext':
        // taskDefinition: DEFINE TASK IDENTIFIER SEMICOLON
        // IDENTIFIER is at position 2
        return this.getIdentifierAtPosition(parseTree, 2, symbolName);
        
      case 'DataDefinitionContext':
        // dataDefinition: DEFINE DATA IDENTIFIER (EQUALS STRING)? SEMICOLON
        // IDENTIFIER is at position 2
        return this.getIdentifierAtPosition(parseTree, 2, symbolName);
        
      case 'ExperimentHeaderContext':
        // experimentHeader: EXPERIMENT IDENTIFIER
        // IDENTIFIER is at position 1
        return this.getIdentifierAtPosition(parseTree, 1, symbolName);
        
      case 'SpaceHeaderContext':
        // spaceHeader: SPACE IDENTIFIER OF workflowNameRead
        // IDENTIFIER is at position 1
        return this.getIdentifierAtPosition(parseTree, 1, symbolName);
        
      case 'ParamDefinitionContext':
        // paramDefinition: PARAM IDENTIFIER EQUALS paramValue SEMICOLON
        // IDENTIFIER is at position 1
        return this.getIdentifierAtPosition(parseTree, 1, symbolName);
        
      case 'ParamAssignmentContext':
        // paramAssignment: PARAM IDENTIFIER (EQUALS expression)? SEMICOLON
        // IDENTIFIER is at position 1
        return this.getIdentifierAtPosition(parseTree, 1, symbolName);
        
      default:
        // Fallback to generic search for unknown contexts
        return this.getIdentifierGeneric(parseTree, symbolName);
    }
  }

  private getIdentifierAtPosition(parseTree: any, position: number, symbolName: string): TerminalNode | null {
    if (position >= parseTree.getChildCount()) {
      return null;
    }
    
    const child = parseTree.getChild(position);
    const isTerminalNode = child?.constructor?.name === 'TerminalNode' || child instanceof TerminalNode;
    const textMatches = child?.getText() === symbolName;
    
    if (isTerminalNode && textMatches) {
      return child as TerminalNode;
    }
    
    return null;
  }

  private getIdentifierGeneric(parseTree: any, symbolName: string): TerminalNode | null {
    // Fallback generic search (original implementation)
    for (let i = 0; i < parseTree.getChildCount(); i++) {
      const child = parseTree.getChild(i);
      
      const isTerminalNode = child?.constructor?.name === 'TerminalNode' || child instanceof TerminalNode;
      const textMatches = child?.getText() === symbolName;
      
      if (isTerminalNode && textMatches) {
        return child as TerminalNode;
      }
    }
    
    return null;
  }
}
