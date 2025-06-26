import { BaseSymbol } from 'antlr4-c3';
import { ExperimentSymbol } from '../core/models/symbols/ExperimentSymbol.js';
import { WorkflowSymbol } from '../core/models/symbols/WorkflowSymbol.js';
import { SpaceSymbol } from '../core/models/symbols/SpaceSymbol.js';
import { DocumentManager } from '../core/managers/DocumentsManager.js';
import { DocumentSymbolTable } from '../language/symbolTable/DocumentSymbolTable.js';

export interface SymbolResolutionContext {
  text: string;
  contextName?: string;
  document: any;
  documentManager?: DocumentManager;
  localOnly?: boolean;
}

export interface SymbolTable {
  resolve(name: string, localOnly?: boolean): Promise<BaseSymbol | undefined>;
  resolveSync?(name: string, localOnly?: boolean): BaseSymbol | undefined;
}

export class SymbolResolver {
  /**
   * Generic symbol resolution that all providers can use.
   * Tries symbol tables in priority order based on context.
   */
  static async resolveSymbol(context: SymbolResolutionContext): Promise<BaseSymbol | null> {
    const tables = this.getSymbolTablesInPriorityOrder(context);
    
    for (const { table, name } of tables) {
      if (table) {
        try {
          const result = await table.resolve(context.text, context.localOnly || false);
          if (result) {
            return result;
          }
        } catch (error) {
          // Continue to next table
        }
      }
    }

    return null;
  }

  /**
   * Get valid symbols of a specific type at a position - used by completion providers
   */
  static async getValidSymbolsOfType<T extends BaseSymbol>(
    document: any,
    parseTree: any,
    type: new (...args: any[]) => T,
    documentManager?: DocumentManager
  ): Promise<string[]> {
    // Use the document's existing method if available, otherwise fall back to folder symbol table
    if (document.symbolTable?.getValidSymbolsAtPosition) {
      return document.symbolTable.getValidSymbolsAtPosition(parseTree, type);
    }
    
    // Fallback to folder symbol table
    const folderTable = documentManager?.getDocumentSymbolTableForFile(document.uri);
    if (folderTable?.getValidSymbolsAtPosition) {
      return folderTable.getValidSymbolsAtPosition(parseTree, type);
    }
    
    return [];
  }

  private static getSymbolTablesInPriorityOrder(context: SymbolResolutionContext): Array<{table: SymbolTable, name: string}> {
    const tables: Array<{table: SymbolTable, name: string}> = [];

    // Context-aware prioritization
    if (this.isDefinitionContext(context.contextName)) {
      // For definitions, prioritize local symbol tables first
      if (context.document.symbolTable) {
        tables.push({ table: context.document.symbolTable, name: 'document.symbolTable' });
      }
      if (context.document.workflowSymbolTable) {
        tables.push({ table: context.document.workflowSymbolTable, name: 'document.workflowSymbolTable' });
      }
      const folderTable = context.documentManager?.getDocumentSymbolTableForFile(context.document.uri);
      if (folderTable) {
        tables.push({ table: folderTable, name: 'folderSymbolTable' });
      }
    } else {
      // For references, prioritize folder scope for cross-file resolution
      const folderTable = context.documentManager?.getDocumentSymbolTableForFile(context.document.uri);
      if (folderTable) {
        tables.push({ table: folderTable, name: 'folderSymbolTable' });
      }
      if (context.document.workflowSymbolTable) {
        tables.push({ table: context.document.workflowSymbolTable, name: 'document.workflowSymbolTable' });
      }
      if (context.document.symbolTable) {
        tables.push({ table: context.document.symbolTable, name: 'document.symbolTable' });
      }
    }

    // For ESPACE contexts, also try experiment symbol resolution
    if (this.isEspaceContext(context.contextName)) {
      const experimentSymbol = context.document.symbolTable?.children.find(
        (c: BaseSymbol) => c instanceof ExperimentSymbol
      ) as ExperimentSymbol;
      if (experimentSymbol) {
        tables.push({ table: experimentSymbol, name: 'experimentSymbol' });
      }
    }

    return tables;
  }

  private static isDefinitionContext(contextName?: string): boolean {
    return contextName?.includes('Header') || contextName?.includes('Definition') || false;
  }

  private static isEspaceContext(contextName?: string): boolean {
    return contextName?.startsWith('Espace') || 
           ['ExperimentHeaderContext', 'SpaceHeaderContext', 'ParamDefinitionContext'].includes(contextName || '') || 
           false;
  }

  /**
   * Specialized method for ESPACE task resolution that checks workflow references
   */
  static async resolveEspaceTask(
    text: string, 
    document: any, 
    documentManager?: DocumentManager
  ): Promise<BaseSymbol | null> {
    const experimentSymbol = document.symbolTable?.children.find(
      (c: BaseSymbol) => c instanceof ExperimentSymbol
    ) as ExperimentSymbol;
    
    if (!experimentSymbol) {
      return null;
    }

    // First try local resolution
    const localSymbol = await experimentSymbol.resolve(text, true);
    if (localSymbol) {
      return localSymbol;
    }

    // If not found locally, search in referenced workflows
    const spaces = await experimentSymbol.getSymbolsOfType(SpaceSymbol);
    for (const space of spaces) {
      if (space.workflowReference) {
        const workflowSymbol = await space.workflowReference.resolve(text, false);
        if (workflowSymbol) {
          return workflowSymbol;
        }
      }
    }

    return null;
  }

  /**
   * Specialized method for ESPACE parameter resolution that checks workflow references
   */
  static async resolveEspaceParameter(
    text: string, 
    document: any, 
    documentManager?: DocumentManager
  ): Promise<BaseSymbol | null> {
    console.error(`[RESOLVER] ESPACE-PARAM-START: "${text}"`);
    
    const experimentSymbol = document.symbolTable?.children.find(
      (c: BaseSymbol) => c instanceof ExperimentSymbol
    ) as ExperimentSymbol;
    
    if (!experimentSymbol) {
      console.error(`[RESOLVER] ESPACE-PARAM-NO-EXPERIMENT`);
      return null;
    }

    console.error(`[RESOLVER] ESPACE-PARAM-FOUND-EXP: "${experimentSymbol.name}"`);

    // First try local resolution in experiment
    const localSymbol = await experimentSymbol.resolve(text, true);
    if (localSymbol) {
      console.error(`[RESOLVER] ESPACE-PARAM-FOUND-LOCAL: "${localSymbol.name}"`);
      return localSymbol;
    }

    console.error(`[RESOLVER] ESPACE-PARAM-TRY-WORKFLOWS`);

    // If not found locally, search in referenced workflows for parameters
    const spaces = await experimentSymbol.getSymbolsOfType(SpaceSymbol);
    console.error(`[RESOLVER] ESPACE-PARAM-SPACES: ${spaces.length}`);
    
    for (const space of spaces) {
      console.error(`[RESOLVER] ESPACE-PARAM-SPACE: "${space.name}"`);
      
      if (space.workflowReference) {
        console.error(`[RESOLVER] ESPACE-PARAM-WF-REF: "${space.workflowReference.name}"`);
        
        // Look for parameters in the referenced workflow
        const paramSymbol = await space.workflowReference.resolve(text, false);
        if (paramSymbol) {
          console.error(`[RESOLVER] ESPACE-PARAM-FOUND: "${paramSymbol.name}"`);
          return paramSymbol;
        } else {
          console.error(`[RESOLVER] ESPACE-PARAM-NOT-IN-WF: "${space.workflowReference.name}"`);
        }
      } else {
        console.error(`[RESOLVER] ESPACE-PARAM-NO-WF-REF: "${space.name}"`);
      }
    }

    console.error(`[RESOLVER] ESPACE-PARAM-NOT-FOUND`);
    return null;
  }
}