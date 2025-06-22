// packages/language-server/src/validation/XXPValidator.ts
import { DocumentManager } from '../documents/DocumentManager.js';
import { ValidationResult } from '../types/ValidationTypes.js';
import { ParsedDocument } from '../types/ParsedDocument.js';

export class XXPValidator {
  constructor(private documentManager: DocumentManager) {}

  async validate(document: ParsedDocument): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    if (!document.analysis || document.languageId !== 'xxp') {
      return results;
    }

    // Workflow-specific validations
    results.push(...this.validateWorkflowInheritance(document));
    results.push(...this.validateTaskChain(document));
    results.push(...this.validateTaskImplementations(document));
    results.push(...this.validateDataFlow(document));
    results.push(...this.validateTaskParameters(document));
    results.push(...this.validateCircularDependencies(document));

    return results;
  }

  private validateWorkflowInheritance(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];
    const workflow = document.analysis?.workflow;

    if (!workflow || !workflow.parentWorkflow) {
      return results;
    }

    const symbolTable = this.documentManager.getSymbolTable();

    // Check if parent workflow exists
    const parentSymbol = symbolTable.resolveSymbol(workflow.parentWorkflow, 'global', 'workflow');
    if (!parentSymbol) {
      results.push({
        severity: 'error',
        range: workflow.parentWorkflowRange || workflow.nameRange,
        message: `Parent workflow '${workflow.parentWorkflow}' not found`,
        code: 'xxp-parent-workflow-not-found',
      });
      return results;
    }

    // Check for circular inheritance
    const visited = new Set<string>();
    let current = workflow.name;

    while (current) {
      if (visited.has(current)) {
        results.push({
          severity: 'error',
          range: workflow.nameRange,
          message: 'Circular inheritance detected in workflow hierarchy',
          code: 'xxp-circular-inheritance',
        });
        break;
      }

      visited.add(current);
      const currentWorkflow = symbolTable.getWorkflowInfo(current);
      current = currentWorkflow?.parentWorkflow || '';
    }

    return results;
  }

  private validateTaskChain(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];
    const workflow = document.analysis?.workflow;

    if (!workflow) return results;

    // Check if workflow has tasks but no task chain
    if (workflow.tasks.length > 0 && !workflow.taskChain) {
      results.push({
        severity: 'error',
        range: workflow.nameRange,
        message: `Workflow '${workflow.name}' has no task execution chain defined`,
        code: 'xxp-missing-task-chain',
      });
      return results;
    }

    if (!workflow.taskChain) return results;

    // Validate task chain references
    const definedTasks = new Set(workflow.tasks.map(t => t.name));
    const executionOrder = workflow.taskChain.elements.filter(e => e !== 'START' && e !== 'END');

    for (const taskRef of workflow.taskChain.elements) {
      if (taskRef !== 'START' && taskRef !== 'END' && !definedTasks.has(taskRef)) {
        results.push({
          severity: 'error',
          range: workflow.taskChain.elementRanges[taskRef] || workflow.nameRange,
          message: `Task '${taskRef}' referenced in workflow chain but not found in workflow '${workflow.name}'`,
          code: 'xxp-undefined-task-in-chain',
        });
      }
    }

    // Check for unused tasks
    const usedTasks = new Set(executionOrder);
    for (const task of workflow.tasks) {
      if (!usedTasks.has(task.name)) {
        results.push({
          severity: 'warning',
          range: task.nameRange,
          message: `Task '${task.name}' is defined but not used in execution chain`,
          code: 'xxp-unused-task',
        });
      }
    }

    // Validate START and END presence
    if (!workflow.taskChain.elements.includes('START')) {
      results.push({
        severity: 'error',
        range: workflow.taskChain.range,
        message: 'Task chain must start with START',
        code: 'xxp-missing-start',
      });
    }

    if (!workflow.taskChain.elements.includes('END')) {
      results.push({
        severity: 'error',
        range: workflow.taskChain.range,
        message: 'Task chain must end with END',
        code: 'xxp-missing-end',
      });
    }

    return results;
  }

  private validateTaskImplementations(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];
    const workflow = document.analysis?.workflow;

    if (!workflow) return results;

    for (const task of workflow.tasks) {
      // Check if task has implementation
      if (!task.implementation) {
        results.push({
          severity: 'error',
          range: task.nameRange,
          message: `Abstract task '${task.name}' in workflow '${workflow.name}' has no implementation`,
          code: 'xxp-abstract-task',
        });
      } else {
        // Check if implementation file exists
        const implementationPath = this.resolveImplementationPath(
          document.uri,
          task.implementation
        );

        // This would need to be async in real implementation
        if (!this.fileExists(implementationPath)) {
          results.push({
            severity: 'warning',
            range: task.implementationRange || task.nameRange,
            message: `Implementation file '${task.implementation}' for task '${task.name}' not found`,
            code: 'xxp-implementation-not-found',
          });
        }
      }
    }

    return results;
  }

  private validateDataFlow(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];
    const workflow = document.analysis?.workflow;

    if (!workflow || !workflow.taskChain) return results;

    const availableData = new Set<string>();
    const requiredData = new Set<string>();

    // Add defined data
    for (const data of workflow.data) {
      availableData.add(data.name);
    }

    // Process tasks in execution order
    const executionOrder = workflow.taskChain.elements.filter(e => e !== 'START' && e !== 'END');

    for (const taskName of executionOrder) {
      const task = workflow.tasks.find(t => t.name === taskName);
      if (!task) continue;

      // Check inputs are available
      for (const input of task.inputs) {
        if (!availableData.has(input)) {
          results.push({
            severity: 'error',
            range: task.inputRanges?.[input] || task.nameRange,
            message: `Input data '${input}' for task '${task.name}' is not available`,
            code: 'xxp-missing-input-data',
          });
        }
        requiredData.add(input);
      }

      // Add outputs to available data
      for (const output of task.outputs) {
        availableData.add(output);
      }
    }

    return results;
  }

  private validateTaskParameters(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];
    const workflow = document.analysis?.workflow;

    if (!workflow) return results;

    for (const task of workflow.tasks) {
      const requiredParams = task.parameters.filter(p => p.required);

      for (const param of requiredParams) {
        // This check would be more complex in real implementation
        // checking against space configurations
        if (!param.hasDefault) {
          results.push({
            severity: 'info',
            range: param.range,
            message: `Parameter '${param.name}' in task '${task.name}' has no default value`,
            code: 'xxp-parameter-no-default',
          });
        }
      }
    }

    return results;
  }

  private validateCircularDependencies(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];
    const workflow = document.analysis?.workflow;

    if (!workflow) return results;

    // Build dependency graph based on data flow
    const dependencyGraph = new Map<string, string[]>();

    for (const task of workflow.tasks) {
      dependencyGraph.set(task.name, []);

      // Find tasks that produce data this task needs
      for (const input of task.inputs) {
        for (const otherTask of workflow.tasks) {
          if (otherTask.name !== task.name && otherTask.outputs.includes(input)) {
            dependencyGraph.get(task.name)!.push(otherTask.name);
          }
        }
      }
    }

    // Check for circular dependencies
    for (const [taskName] of dependencyGraph) {
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      if (this.hasCircularDependency(taskName, dependencyGraph, visited, recursionStack)) {
        results.push({
          severity: 'error',
          range: workflow.tasks.find(t => t.name === taskName)?.nameRange || workflow.nameRange,
          message: `Circular data dependency detected involving task '${taskName}'`,
          code: 'xxp-circular-dependency',
        });
      }
    }

    return results;
  }

  private hasCircularDependency(
    node: string,
    graph: Map<string, string[]>,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    if (recursionStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    recursionStack.add(node);

    const dependencies = graph.get(node) || [];
    for (const dep of dependencies) {
      if (this.hasCircularDependency(dep, graph, visited, recursionStack)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  private resolveImplementationPath(documentUri: string, implementation: string): string {
    // TODO: Simplified implementation - would need proper path resolution
    return implementation;
  }

  private fileExists(path: string): boolean {
    // TOOD: This would need to be async and actually check the file system
    return true;
  }
}
