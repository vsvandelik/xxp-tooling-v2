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
  EspaceWorkflowNameReadContext,
  EspaceTaskNameReadContext,
  EspaceSpaceNameReadContext,
  EspaceDataDefinitionContext,
  EspaceParamDefinitionContext,
  EspaceExperimentHeaderContext,
  EspaceSpaceHeaderContext,
  ESPACEParser,
} from '@extremexp/core';
import { BaseSymbol } from 'antlr4-c3';
import { TerminalNode } from 'antlr4ng';

export class ReferencesProvider extends Provider {
  private logger = Logger.getLogger();

  addHandlers(): void {
    this.connection!.onReferences(referenceParams => this.onReferences(referenceParams));
    this.connection!.onDefinition(tokenPosition => this.onDefinition(tokenPosition));
  }

  // Helper method to search for symbols in all available symbol tables
  private async findSymbolInAllTables(document: any, symbolName: string, symbolType: any): Promise<BaseSymbol | null> {
    // Try workflowSymbolTable first
    if (document.workflowSymbolTable) {
      const result = (await document.workflowSymbolTable.resolve(symbolName, false)) || null;
      if (result && result instanceof symbolType) return result;
      
      // Search directly in children
      const children = document.workflowSymbolTable.children || [];
      for (const child of children) {
        if (child.name === symbolName && child instanceof symbolType) {
          return child;
        }
      }
    }

    // Try regular symbolTable
    if (document.symbolTable) {
      const result = (await document.symbolTable.resolve(symbolName, false)) || null;
      if (result && result instanceof symbolType) return result;
      
      // Search directly in children
      const children = document.symbolTable.children || [];
      for (const child of children) {
        if (child.name === symbolName && child instanceof symbolType) {
          return child;
        }
      }
      
      // Also try with local flag
      const localResult = (await document.symbolTable.resolve(symbolName, true)) || null;
      if (localResult && localResult instanceof symbolType) return localResult;
    }

    return null;
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
    const contextName = tokenPosition.parseTree?.constructor?.name;
    
    // Universal symbol search approach - try all methods for all symbol types
    const symbolName = tokenPosition.text;
    
    // Strategy 1: Try the specialized lookup methods based on context
    let result = await this.trySpecializedLookup(document, tokenPosition, contextName);
    if (result) return result;
    
    // Strategy 2: Try universal symbol table search
    result = await this.tryUniversalLookup(document, symbolName);
    if (result) return result;
    
    return null;
  }

  private async trySpecializedLookup(document: any, tokenPosition: any, contextName: string): Promise<BaseSymbol | null> {
    const symbolName = tokenPosition.text;

    // Handle experiment and workflow headers with comprehensive search
    if (contextName === 'ExperimentHeaderContext' || 
        tokenPosition.parseTree instanceof EspaceExperimentHeaderContext) {
      return await this.findSymbolInAllTables(document, symbolName, ExperimentSymbol);
    }

    if (contextName === 'WorkflowHeaderContext' || 
        tokenPosition.parseTree instanceof XxpWorkflowHeaderContext) {
      return await this.findSymbolInAllTables(document, symbolName, WorkflowSymbol);
    }

    // Handle param definitions with recursive search
    if (contextName === 'ParamDefinitionContext' || 
        tokenPosition.parseTree instanceof EspaceParamDefinitionContext) {
      if (document.symbolTable) {
        const result = (await document.symbolTable.resolve(symbolName, true)) || null;
        if (result) return result;
        
        // Recursive search through all scopes
        const searchInScope = async (scope: any): Promise<BaseSymbol | null> => {
          if (!scope || !scope.children) return null;
          
          for (const child of scope.children) {
            if (child.name === symbolName && child.constructor.name.includes('Param')) {
              return child;
            }
            const nestedResult = await searchInScope(child);
            if (nestedResult) return nestedResult;
          }
          return null;
        };
        
        return await searchInScope(document.symbolTable);
      }
    }

    // Handle workflow references
    if (
      tokenPosition.parseTree instanceof XxpWorkflowNameReadContext ||
      tokenPosition.parseTree instanceof EspaceWorkflowNameReadContext ||
      tokenPosition.parseTree?.constructor?.name === 'WorkflowNameReadContext'
    ) {
      // For workflows, we need to look in the folder symbol table
      const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(document.uri);
      const result = (await folderSymbolTable?.resolve(tokenPosition.text, false)) || null;
      return result;
    }

    // Handle space references in ESPACE files
    if (tokenPosition.parseTree instanceof EspaceSpaceNameReadContext ||
        tokenPosition.parseTree?.constructor?.name === 'SpaceNameReadContext') {
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        const result = (await experimentSymbol.resolve(tokenPosition.text, false)) || null;
        return result;
      }
    }

    // Handle task references in ESPACE files
    if (tokenPosition.parseTree instanceof EspaceTaskNameReadContext ||
        tokenPosition.parseTree?.constructor?.name === 'TaskNameReadContext') {
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

    // Handle space definitions in ESPACE files
    if (tokenPosition.parseTree instanceof EspaceSpaceHeaderContext ||
        tokenPosition.parseTree?.constructor?.name === 'SpaceHeaderContext') {
      // Look for space symbols in the experiment's symbol table
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        const result = (await experimentSymbol.resolve(tokenPosition.text, false)) || null;
        return result;
      }
    }

    // Handle data definitions in ESPACE files
    if (tokenPosition.parseTree instanceof EspaceDataDefinitionContext ||
        tokenPosition.parseTree?.constructor?.name === 'DataDefinitionContext') {
      // Look for data symbols in the current document's symbol table
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        const result = (await experimentSymbol.resolve(tokenPosition.text, false)) || null;
        return result;
      }
    }

    // Handle param definitions in ESPACE files
    if (contextName === 'ParamDefinitionContext' || 
        tokenPosition.parseTree instanceof EspaceParamDefinitionContext) {
      // For param definitions, resolve directly from the document's symbol table
      // which will search through all scopes including space scopes
      if (document.symbolTable) {
        const result = (await document.symbolTable.resolve(tokenPosition.text, true)) || null;
        if (result) return result;
        
        // If direct resolution fails, search manually through all children and nested scopes
        const searchInScope = async (scope: any): Promise<BaseSymbol | null> => {
          if (!scope || !scope.children) return null;
          
          for (const child of scope.children) {
            if (child.name === tokenPosition.text && child.constructor.name.includes('Param')) {
              return child;
            }
            // Recursively search in nested scopes
            const nestedResult = await searchInScope(child);
            if (nestedResult) return nestedResult;
          }
          return null;
        };
        
        return await searchInScope(document.symbolTable);
      }
    }

    // Continue with other existing specialized context handlers
    return await this.handleOtherContexts(document, tokenPosition);
  }

  private async handleOtherContexts(document: any, tokenPosition: any): Promise<BaseSymbol | null> {
    // Handle workflow references
    if (
      tokenPosition.parseTree instanceof XxpWorkflowNameReadContext ||
      tokenPosition.parseTree instanceof EspaceWorkflowNameReadContext ||
      tokenPosition.parseTree?.constructor?.name === 'WorkflowNameReadContext'
    ) {
      // For workflows, we need to look in the folder symbol table
      const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(document.uri);
      const result = (await folderSymbolTable?.resolve(tokenPosition.text, false)) || null;
      return result;
    }

    // Handle space references in ESPACE files
    if (tokenPosition.parseTree instanceof EspaceSpaceNameReadContext ||
        tokenPosition.parseTree?.constructor?.name === 'SpaceNameReadContext') {
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        const result = (await experimentSymbol.resolve(tokenPosition.text, false)) || null;
        return result;
      }
    }

    // Handle task references in ESPACE files
    if (tokenPosition.parseTree instanceof EspaceTaskNameReadContext ||
        tokenPosition.parseTree?.constructor?.name === 'TaskNameReadContext') {
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

    // Handle space definitions in ESPACE files
    if (tokenPosition.parseTree instanceof EspaceSpaceHeaderContext ||
        tokenPosition.parseTree?.constructor?.name === 'SpaceHeaderContext') {
      // Look for space symbols in the experiment's symbol table
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        const result = (await experimentSymbol.resolve(tokenPosition.text, false)) || null;
        return result;
      }
    }

    // Handle data definitions in ESPACE files
    if (tokenPosition.parseTree instanceof EspaceDataDefinitionContext ||
        tokenPosition.parseTree?.constructor?.name === 'DataDefinitionContext') {
      // Look for data symbols in the current document's symbol table
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        const result = (await experimentSymbol.resolve(tokenPosition.text, false)) || null;
        return result;
      }
    }

    return null;
  }

  private async tryUniversalLookup(document: any, symbolName: string): Promise<BaseSymbol | null> {
    // Try all symbol types in all available tables
    const symbolTypes = [ExperimentSymbol, WorkflowSymbol, SpaceSymbol];
    
    for (const symbolType of symbolTypes) {
      const result = await this.findSymbolInAllTables(document, symbolName, symbolType);
      if (result) return result;
    }
    
    // Fall back to original resolution logic for other cases
    return await this.fallbackResolution(document, symbolName);
  }

  private async fallbackResolution(document: any, symbolName: string): Promise<BaseSymbol | null> {
    if (document.workflowSymbolTable) {
      const result = (await document.workflowSymbolTable.resolve(symbolName, false)) || null;
      if (result) return result;
    }

    if (document.symbolTable) {
      const result = (await document.symbolTable.resolve(symbolName, false)) || null;
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

    // Find the identifier node within the declaration context
    let identifierNode: TerminalNode | null = null;
    
    // Search through all children to find the matching identifier
    for (let i = 0; i < parseTree.getChildCount(); i++) {
      const child = parseTree.getChild(i);
      
      // Check by constructor name and instanceof to handle different TerminalNode types
      const isTerminalNode = child?.constructor?.name === 'TerminalNode' || child instanceof TerminalNode;
      const textMatches = child?.getText() === symbol.name;
      
      if (isTerminalNode && textMatches) {
        identifierNode = child as TerminalNode;
        break;
      }
    }
    
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
}
