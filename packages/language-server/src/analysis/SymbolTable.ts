// packages/language-server/src/analysis/SymbolTable.ts
import { Range } from 'vscode-languageserver/node';
import { WorkspaceManager } from '../workspace/WorkspaceManager.js';

export interface Symbol {
  name: string;
  type: SymbolType;
  kind: SymbolKind;
  uri: string;
  range: Range;
  selectionRange?: Range;
  scope: string;
  documentation?: string;
  children?: Symbol[];
  data?: any;
}

export type SymbolType =
  | 'workflow'
  | 'experiment'
  | 'space'
  | 'task'
  | 'parameter'
  | 'data'
  | 'strategy';

export type SymbolKind = 'definition' | 'reference';

export interface WorkflowInfo {
  name: string;
  uri: string;
  parentWorkflow?: string;
  tasks: TaskInfo[];
  data: DataInfo[];
  taskChain?: {
    elements: string[];
    range: Range;
  };
}

export interface TaskInfo {
  name: string;
  implementation?: string;
  parameters: ParameterInfo[];
  inputs: string[];
  outputs: string[];
  definitionLocation?: Location;
  documentation?: string;
}

export interface ParameterInfo {
  name: string;
  type?: string;
  required: boolean;
  hasDefault: boolean;
  defaultValue?: any;
  definitionLocation?: Location;
  documentation?: string;
}

export interface DataInfo {
  name: string;
  value?: string;
  definitionLocation?: Location;
  documentation?: string;
}

export interface Location {
  uri: string;
  range: Range;
}

export class SymbolTable {
  // Document URI -> Symbols
  private documentSymbols = new Map<string, Symbol[]>();

  // Symbol type -> name -> Symbol[]
  private globalSymbols = new Map<SymbolType, Map<string, Symbol[]>>();

  // Workflow name -> WorkflowInfo
  private workflows = new Map<string, WorkflowInfo>();

  // Experiment name -> ExperimentInfo
  private experiments = new Map<string, any>();

  // Document URI -> imported symbols
  private imports = new Map<string, string[]>();

  // Document URI -> dependent documents
  private dependencies = new Map<string, Set<string>>();

  constructor(private workspaceManager: WorkspaceManager) {
    this.initializeSymbolTypes();
  }

  private initializeSymbolTypes(): void {
    const types: SymbolType[] = [
      'workflow',
      'experiment',
      'space',
      'task',
      'parameter',
      'data',
      'strategy',
    ];

    for (const type of types) {
      this.globalSymbols.set(type, new Map());
    }
  }

  updateDocument(uri: string, symbols: Symbol[], imports: string[]): void {
    // Clear old symbols for this document
    this.removeDocument(uri);

    // Store new symbols
    this.documentSymbols.set(uri, symbols);

    // Update global symbol index
    for (const symbol of symbols) {
      if (symbol.kind === 'definition') {
        const typeMap = this.globalSymbols.get(symbol.type);
        if (typeMap) {
          const existing = typeMap.get(symbol.name) || [];
          existing.push(symbol);
          typeMap.set(symbol.name, existing);
        }

        // Update specialized structures
        this.updateSpecializedStructures(symbol);
      }
    }

    // Update imports
    this.imports.set(uri, imports);
    this.updateDependencies(uri, imports);
  }

  removeDocument(uri: string): void {
    const symbols = this.documentSymbols.get(uri);
    if (symbols) {
      // Remove from global index
      for (const symbol of symbols) {
        if (symbol.kind === 'definition') {
          const typeMap = this.globalSymbols.get(symbol.type);
          if (typeMap) {
            const existing = typeMap.get(symbol.name);
            if (existing) {
              const filtered = existing.filter(s => s.uri !== uri);
              if (filtered.length > 0) {
                typeMap.set(symbol.name, filtered);
              } else {
                typeMap.delete(symbol.name);
              }
            }
          }
        }
      }
    }

    this.documentSymbols.delete(uri);
    this.imports.delete(uri);

    // Remove from dependencies
    for (const [, deps] of this.dependencies) {
      deps.delete(uri);
    }
  }

  resolveSymbol(name: string, scope: string, type: SymbolType): Symbol | null {
    const typeMap = this.globalSymbols.get(type);
    if (!typeMap) return null;

    const candidates = typeMap.get(name);
    if (!candidates || candidates.length === 0) return null;

    // Try to find symbol in the requested scope
    for (const symbol of candidates) {
      if (symbol.scope === scope || symbol.scope === 'global') {
        return symbol;
      }
    }

    // If not found in specific scope, return global symbol if available
    return candidates.find(s => s.scope === 'global') || candidates[0] || null;
  }

  getReferences(name: string, type: SymbolType): Location[] {
    const references: Location[] = [];

    // Search all documents for references
    for (const [uri, symbols] of this.documentSymbols) {
      for (const symbol of symbols) {
        if (symbol.name === name && symbol.type === type) {
          references.push({
            uri: symbol.uri,
            range: symbol.range,
          });
        }
      }
    }

    return references;
  }

  getAllSymbols(type: SymbolType): Symbol[] {
    const typeMap = this.globalSymbols.get(type);
    if (!typeMap) return [];

    const symbols: Symbol[] = [];
    for (const symbolList of typeMap.values()) {
      symbols.push(...symbolList);
    }

    return symbols;
  }

  getWorkflowInfo(name: string): WorkflowInfo | null {
    return this.workflows.get(name) || null;
  }

  getWorkflowTasks(workflowName: string): TaskInfo[] {
    const workflow = this.workflows.get(workflowName);
    return workflow ? workflow.tasks : [];
  }

  getWorkflowData(workflowName: string): DataInfo[] {
    const workflow = this.workflows.get(workflowName);
    return workflow ? workflow.data : [];
  }

  getExperiment(name: string): any {
    return this.experiments.get(name);
  }

  getTaskInfo(workflowName: string, taskName: string): TaskInfo | null {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) return null;

    return workflow.tasks.find(t => t.name === taskName) || null;
  }

  getTaskParameters(taskName: string): ParameterInfo[] {
    // Search across all workflows
    for (const workflow of this.workflows.values()) {
      const task = workflow.tasks.find(t => t.name === taskName);
      if (task) {
        return task.parameters;
      }
    }
    return [];
  }

  getParameterInfo(taskName: string, paramName: string): ParameterInfo | null {
    const params = this.getTaskParameters(taskName);
    return params.find(p => p.name === paramName) || null;
  }

  getExperimentSpaces(experimentName: string): any[] {
    const experiment = this.experiments.get(experimentName);
    return experiment ? experiment.spaces : [];
  }

  getDependents(uri: string): string[] {
    const dependents: string[] = [];

    for (const [dependentUri, deps] of this.dependencies) {
      if (deps.has(uri)) {
        dependents.push(dependentUri);
      }
    }

    return dependents;
  }

  private updateSpecializedStructures(symbol: Symbol): void {
    switch (symbol.type) {
      case 'workflow':
        if (symbol.data) {
          this.workflows.set(symbol.name, symbol.data as WorkflowInfo);
        }
        break;

      case 'experiment':
        if (symbol.data) {
          this.experiments.set(symbol.name, symbol.data);
        }
        break;
    }
  }

  private updateDependencies(uri: string, imports: string[]): void {
    const deps = new Set<string>();

    // Find URIs for imported symbols
    for (const importName of imports) {
      // Look for workflow imports
      const workflowSymbols = this.globalSymbols.get('workflow')?.get(importName);
      if (workflowSymbols) {
        for (const symbol of workflowSymbols) {
          deps.add(symbol.uri);
        }
      }
    }

    this.dependencies.set(uri, deps);
  }

  // Debug method to print symbol table contents
  debug(): void {
    console.log('=== Symbol Table Debug ===');
    console.log('Documents:', this.documentSymbols.size);

    for (const [type, typeMap] of this.globalSymbols) {
      console.log(`\n${type} symbols:`);
      for (const [name, symbols] of typeMap) {
        console.log(`  ${name}: ${symbols.length} definition(s)`);
      }
    }

    console.log('\nWorkflows:', this.workflows.size);
    for (const [name, info] of this.workflows) {
      console.log(`  ${name}: ${info.tasks.length} tasks`);
    }
  }
}
