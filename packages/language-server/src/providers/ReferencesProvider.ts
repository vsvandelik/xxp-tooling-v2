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
    console.log('[REFS] Adding handlers for ReferencesProvider');
    console.error('[REFS] Adding handlers for ReferencesProvider');
    this.connection!.onReferences(referenceParams => this.onReferences(referenceParams));
    this.connection!.onDefinition(tokenPosition => this.onDefinition(tokenPosition));
    console.log('[REFS] Handlers added successfully');
    console.error('[REFS] Handlers added successfully');
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
    console.log(`[REFS] Definition request: ${params.textDocument.uri} at ${JSON.stringify(params.position)}`);
    console.error(`[REFS] Definition request: ${params.textDocument.uri} at ${JSON.stringify(params.position)}`);
    
    const result = super.getDocumentAndPosition(params.textDocument, params.position);
    if (!result) {
      console.log(`[REFS] Failed to get document and position`);
      console.error(`[REFS] Failed to get document and position`);
      return Promise.resolve(null);
    }
    const [document, tokenPosition] = result;

    console.error(`[REFS] TokenPosition: text="${tokenPosition.text}", context="${tokenPosition.parseTree?.constructor?.name}"`);

    const symbol = await this.resolveSymbol(document, tokenPosition);
    if (!symbol) {
      console.error(`[REFS] No symbol found for "${tokenPosition.text}"`);
      return null;
    }

    console.error(`[REFS] Found symbol: name="${symbol.name}", type="${symbol.constructor.name}"`);

    if (!this.hasDeclaration(symbol)) {
      console.error(`[REFS] Symbol "${symbol.name}" has no declaration`);
      return null;
    }

    const location = this.getLocationFromDeclaration(symbol);
    console.error(`[REFS] Generated location: ${location ? JSON.stringify(location.range) : 'null'}`);
    return location;
  }

  private async resolveSymbol(document: any, tokenPosition: any): Promise<BaseSymbol | null> {
    // Use context name-based resolution instead of instanceof checks
    // This is more robust and handles context type variations
    const contextName = tokenPosition.parseTree?.constructor?.name;
    const text = tokenPosition.text;

    console.error(`[REFS] resolveSymbol: "${text}" in context "${contextName}"`);
    console.error(`[REFS] Available symbol tables: symbolTable=${!!document.symbolTable}, workflowSymbolTable=${!!document.workflowSymbolTable}`);

    // Handle workflow header contexts (definitions)
    if (contextName === 'WorkflowHeaderContext') {
      console.error(`[REFS] Handling WorkflowHeaderContext`);
      
      if (document.symbolTable) {
        console.error(`[REFS] Trying document.symbolTable`);
        const result = await document.symbolTable.resolve(tokenPosition.text, false);
        if (result) {
          console.error(`[REFS] Found in document.symbolTable: ${result.name}`);
          return result;
        }
      }
      
      if (document.workflowSymbolTable) {
        console.error(`[REFS] Trying document.workflowSymbolTable`);
        const result = await document.workflowSymbolTable.resolve(tokenPosition.text, false);
        if (result) {
          console.error(`[REFS] Found in document.workflowSymbolTable: ${result.name}`);
          return result;
        }
      }
      
      const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(document.uri);
      if (folderSymbolTable) {
        console.error(`[REFS] Trying folderSymbolTable`);
        const result = await folderSymbolTable.resolve(tokenPosition.text, false);
        if (result) {
          console.error(`[REFS] Found in folderSymbolTable: ${result.name}`);
          return result;
        }
      }
      
      console.error(`[REFS] WorkflowHeaderContext: No symbol found in any table`);
    }

    // Handle task definition contexts
    if (contextName === 'TaskDefinitionContext') {
      console.error(`[REFS] Handling TaskDefinitionContext`);
      // For task definitions, look in the workflow symbol table
      if (document.workflowSymbolTable) {
        console.error(`[REFS] Trying document.workflowSymbolTable for TaskDefinitionContext`);
        const result = await document.workflowSymbolTable.resolve(tokenPosition.text, false);
        if (result) {
          console.error(`[REFS] Found in workflowSymbolTable: ${result.name}`);
          return result;
        }
        console.error(`[REFS] TaskDefinitionContext: No symbol found in workflowSymbolTable`);
      } else {
        console.error(`[REFS] TaskDefinitionContext: No workflowSymbolTable available`);
      }
    }

    // Handle data definition contexts
    if (contextName === 'DataDefinitionContext') {
      console.error(`[REFS] Handling DataDefinitionContext`);
      // For data definitions, look in the workflow symbol table
      if (document.workflowSymbolTable) {
        console.error(`[REFS] Trying document.workflowSymbolTable for DataDefinitionContext`);
        const result = await document.workflowSymbolTable.resolve(tokenPosition.text, false);
        if (result) {
          console.error(`[REFS] Found in workflowSymbolTable: ${result.name}`);
          return result;
        }
        console.error(`[REFS] DataDefinitionContext: No symbol found in workflowSymbolTable`);
      } else {
        console.error(`[REFS] DataDefinitionContext: No workflowSymbolTable available`);
      }
    }

    // Handle parameter assignment contexts
    if (contextName === 'ParamAssignmentContext') {
      console.error(`[REFS] Handling ParamAssignmentContext`);
      // For param assignments, look in the workflow symbol table
      if (document.workflowSymbolTable) {
        console.error(`[REFS] Trying document.workflowSymbolTable for ParamAssignmentContext`);
        const result = await document.workflowSymbolTable.resolve(tokenPosition.text, false);
        if (result) {
          console.error(`[REFS] Found in workflowSymbolTable: ${result.name}`);
          return result;
        }
        console.error(`[REFS] ParamAssignmentContext: No symbol found in workflowSymbolTable`);
      } else {
        console.error(`[REFS] ParamAssignmentContext: No workflowSymbolTable available`);
      }
    }

    // Handle experiment header contexts (ESPACE definitions)
    if (contextName === 'ExperimentHeaderContext') {
      console.error(`[REFS] Handling ExperimentHeaderContext`);
      // For experiment definitions, look in the document's symbol table
      if (document.symbolTable) {
        console.error(`[REFS] Trying document.symbolTable for ExperimentHeaderContext`);
        const result = await document.symbolTable.resolve(tokenPosition.text, false);
        if (result) {
          console.error(`[REFS] Found in symbolTable: ${result.name}`);
          return result;
        }
        console.error(`[REFS] ExperimentHeaderContext: No symbol found in symbolTable`);
      } else {
        console.error(`[REFS] ExperimentHeaderContext: No symbolTable available`);
      }
    }

    // Handle space header contexts (ESPACE space definitions)
    if (contextName === 'SpaceHeaderContext') {
      console.error(`[REFS] Handling SpaceHeaderContext`);
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        console.error(`[REFS] Trying experimentSymbol for SpaceHeaderContext`);
        const result = await experimentSymbol.resolve(tokenPosition.text, false);
        if (result) {
          console.error(`[REFS] Found in experimentSymbol: ${result.name}`);
          return result;
        }
        console.error(`[REFS] SpaceHeaderContext: No symbol found in experimentSymbol`);
      } else {
        console.error(`[REFS] SpaceHeaderContext: No experimentSymbol available`);
      }
    }

    // Handle parameter definition contexts (ESPACE)
    if (contextName === 'ParamDefinitionContext') {
      console.error(`[REFS] Handling ParamDefinitionContext`);
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        console.error(`[REFS] Trying experimentSymbol for ParamDefinitionContext`);
        const result = await experimentSymbol.resolve(tokenPosition.text, false);
        if (result) {
          console.error(`[REFS] Found in experimentSymbol: ${result.name}`);
          return result;
        }
        console.error(`[REFS] ParamDefinitionContext: No symbol found in experimentSymbol`);
      } else {
        console.error(`[REFS] ParamDefinitionContext: No experimentSymbol available`);
      }
    }

    // Handle workflow references (usage, not definition)
    if (contextName === 'WorkflowNameReadContext') {
      console.error(`[REFS] Handling WorkflowNameReadContext`);
      // For workflow references, look in the folder symbol table
      const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(document.uri);
      if (folderSymbolTable) {
        console.error(`[REFS] Trying folderSymbolTable for WorkflowNameReadContext`);
        const result = await folderSymbolTable.resolve(tokenPosition.text, false);
        if (result) {
          console.error(`[REFS] Found in folderSymbolTable: ${result.name}`);
          return result;
        }
        console.error(`[REFS] WorkflowNameReadContext: No symbol found in folderSymbolTable`);
      } else {
        console.error(`[REFS] WorkflowNameReadContext: No folderSymbolTable available`);
      }
    }

    // Handle space references in ESPACE files
    if (contextName === 'SpaceNameReadContext') {
      console.error(`[REFS] Handling SpaceNameReadContext`);
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        console.error(`[REFS] Trying experimentSymbol for SpaceNameReadContext`);
        const result = await experimentSymbol.resolve(tokenPosition.text, false);
        if (result) {
          console.error(`[REFS] Found in experimentSymbol: ${result.name}`);
          return result;
        }
        console.error(`[REFS] SpaceNameReadContext: No symbol found in experimentSymbol`);
      } else {
        console.error(`[REFS] SpaceNameReadContext: No experimentSymbol available`);
      }
    }

    // Handle task references in ESPACE files
    if (contextName === 'TaskNameReadContext') {
      console.error(`[REFS] Handling TaskNameReadContext`);
      // First try local resolution
      const experimentSymbol = document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        console.error(`[REFS] Trying local experimentSymbol for TaskNameReadContext`);
        const localSymbol = await experimentSymbol.resolve(tokenPosition.text, true);
        if (localSymbol) {
          console.error(`[REFS] Found locally in experimentSymbol: ${localSymbol.name}`);
          return localSymbol;
        }

        // If not found locally, search in referenced workflows
        console.error(`[REFS] Trying workflow references for TaskNameReadContext`);
        const spaces = await experimentSymbol.getSymbolsOfType(SpaceSymbol);
        for (const space of spaces) {
          if (space.workflowReference) {
            const workflowSymbol = await space.workflowReference.resolve(tokenPosition.text, false);
            if (workflowSymbol) {
              console.error(`[REFS] Found in workflow reference: ${workflowSymbol.name}`);
              return workflowSymbol;
            }
          }
        }
        console.error(`[REFS] TaskNameReadContext: No symbol found in local or workflow references`);
      } else {
        console.error(`[REFS] TaskNameReadContext: No experimentSymbol available`);
      }
    }

    // Default resolution for other symbols - try all symbol tables
    console.error(`[REFS] Using default resolution for context: ${contextName}`);

    // First try workflow symbol table
    if (document.workflowSymbolTable) {
      console.error(`[REFS] Default: Trying document.workflowSymbolTable`);
      const result = await document.workflowSymbolTable.resolve(tokenPosition.text, false);
      if (result) {
        console.error(`[REFS] Default: Found in workflowSymbolTable: ${result.name}`);
        return result;
      }
    }
    
    // Then try document symbol table
    if (document.symbolTable) {
      console.error(`[REFS] Default: Trying document.symbolTable`);
      const result = await document.symbolTable.resolve(tokenPosition.text, false);
      if (result) {
        console.error(`[REFS] Default: Found in symbolTable: ${result.name}`);
        return result;
      }
    }
    
    // Finally try folder symbol table
    const folderSymbolTable = this.documentManager?.getDocumentSymbolTableForFile(document.uri);
    if (folderSymbolTable) {
      console.error(`[REFS] Default: Trying folderSymbolTable`);
      const result = await folderSymbolTable.resolve(tokenPosition.text, false);
      if (result) {
        console.error(`[REFS] Default: Found in folderSymbolTable: ${result.name}`);
        return result;
      }
    }

    console.error(`[REFS] Default resolution failed: No symbol found in any table`);
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
    console.error(`[REFS] getLocationFromDeclaration: symbol="${symbol.name}", type="${symbol.constructor.name}"`);
    
    if (
      !(
        symbol instanceof TerminalSymbolWithReferences ||
        symbol instanceof WorkflowSymbol ||
        symbol instanceof ExperimentSymbol
      )
    ) {
      console.error(`[REFS] getLocationFromDeclaration: Invalid symbol type`);
      return undefined;
    }

    const parseTree = symbol.context;
    if (!parseTree) {
      console.error(`[REFS] getLocationFromDeclaration: No parseTree/context`);
      return undefined;
    }

    console.error(`[REFS] getLocationFromDeclaration: parseTree context="${parseTree.constructor.name}"`);

    // Find the identifier node using context-specific approach
    let identifierNode: TerminalNode | null = this.getIdentifierFromContext(parseTree, symbol.name);
    
    if (!identifierNode) {
      console.error(`[REFS] getLocationFromDeclaration: No identifierNode found`);
      return undefined;
    }

    console.error(`[REFS] getLocationFromDeclaration: identifierNode found, text="${identifierNode.getText()}"`);

    // Try RangeUtils first, fallback to manual range creation
    let definitionRange = RangeUtils.getRangeFromParseTree(identifierNode);
    console.error(`[REFS] getLocationFromDeclaration: RangeUtils result=${definitionRange ? JSON.stringify(definitionRange) : 'null'}`);
    
    if (!definitionRange && identifierNode.symbol) {
      console.error(`[REFS] getLocationFromDeclaration: Using fallback range creation`);
      definitionRange = Range.create(
        identifierNode.symbol.line - 1,
        identifierNode.symbol.column,
        identifierNode.symbol.line - 1,
        identifierNode.symbol.column + identifierNode.getText().length
      );
      console.error(`[REFS] getLocationFromDeclaration: Fallback range=${definitionRange ? JSON.stringify(definitionRange) : 'null'}`);
    }
    
    if (!definitionRange) {
      console.error(`[REFS] getLocationFromDeclaration: No definitionRange available`);
      return undefined;
    }

    const result = {
      uri: symbol.document.uri,
      range: definitionRange,
    };
    console.error(`[REFS] getLocationFromDeclaration: Final result=${JSON.stringify(result)}`);
    return result;
  }

  private getIdentifierFromContext(parseTree: any, symbolName: string): TerminalNode | null {
    const contextName = parseTree.constructor.name;
    console.error(`[REFS] getIdentifierFromContext: contextName="${contextName}", symbolName="${symbolName}"`);
    
    // Context-specific identifier resolution based on grammar structure
    switch (contextName) {
      case 'WorkflowHeaderContext':
        // workflowHeader: WORKFLOW IDENTIFIER (FROM workflowNameRead)?
        // IDENTIFIER is at position 1
        console.error(`[REFS] getIdentifierFromContext: Using WorkflowHeaderContext logic`);
        return this.getIdentifierAtPosition(parseTree, 1, symbolName);
        
      case 'WorkflowDeclarationContext':
        // WorkflowDeclarationContext contains WorkflowHeaderContext as first child
        console.error(`[REFS] getIdentifierFromContext: Using WorkflowDeclarationContext logic`);
        if (parseTree.getChildCount() > 0) {
          const workflowHeaderChild = parseTree.getChild(0);
          if (workflowHeaderChild?.constructor?.name === 'WorkflowHeaderContext') {
            console.error(`[REFS] WorkflowDeclarationContext: Found WorkflowHeaderContext child, delegating`);
            // WorkflowHeaderContext: WORKFLOW IDENTIFIER (FROM workflowNameRead)?
            return this.getIdentifierAtPosition(workflowHeaderChild, 1, symbolName);
          }
        }
        console.error(`[REFS] WorkflowDeclarationContext: Fallback to generic search`);
        return this.getIdentifierGeneric(parseTree, symbolName);
        
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
        
      case 'ExperimentDeclarationContext':
        // ExperimentDeclarationContext contains ExperimentHeaderContext as first child
        console.error(`[REFS] getIdentifierFromContext: Using ExperimentDeclarationContext logic`);
        if (parseTree.getChildCount() > 0) {
          const experimentHeaderChild = parseTree.getChild(0);
          if (experimentHeaderChild?.constructor?.name === 'ExperimentHeaderContext') {
            console.error(`[REFS] ExperimentDeclarationContext: Found ExperimentHeaderContext child, delegating`);
            // ExperimentHeaderContext: EXPERIMENT IDENTIFIER
            return this.getIdentifierAtPosition(experimentHeaderChild, 1, symbolName);
          }
        }
        console.error(`[REFS] ExperimentDeclarationContext: Fallback to generic search`);
        return this.getIdentifierGeneric(parseTree, symbolName);
        
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
    console.error(`[REFS] getIdentifierAtPosition: position=${position}, symbolName="${symbolName}"`);
    console.error(`[REFS] getIdentifierAtPosition: parseTree.getChildCount()=${parseTree.getChildCount()}`);
    
    if (position >= parseTree.getChildCount()) {
      console.error(`[REFS] getIdentifierAtPosition: Position ${position} >= childCount ${parseTree.getChildCount()}`);
      return null;
    }
    
    const child = parseTree.getChild(position);
    const isTerminalNode = child?.constructor?.name === 'TerminalNode' || child instanceof TerminalNode;
    const textMatches = child?.getText() === symbolName;
    
    console.error(`[REFS] getIdentifierAtPosition: child at ${position}: text="${child?.getText()}", isTerminalNode=${isTerminalNode}, textMatches=${textMatches}`);
    
    if (isTerminalNode && textMatches) {
      console.error(`[REFS] getIdentifierAtPosition: Found matching terminal node`);
      return child as TerminalNode;
    }
    
    console.error(`[REFS] getIdentifierAtPosition: No match found`);
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
