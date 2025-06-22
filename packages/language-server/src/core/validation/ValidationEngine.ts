import { Document } from '../documents/Document.js';
import { WorkflowSymbol } from '../symbols/WorkflowSymbol.js';
import { ExperimentSymbol } from '../symbols/ExperimentSymbol.js';
import { SpaceSymbol } from '../symbols/SpaceSymbol.js';
import { TaskSymbol } from '../symbols/TaskSymbol.js';
import { DataSymbol } from '../symbols/DataSymbol.js';
import { Logger } from '../../utils/Logger.js';
import { DiagnosticSeverity } from 'vscode-languageserver';

export class ValidationEngine {
  private logger = Logger.getInstance();

  public validateDocument(document: Document): void {
    if (!document.symbolTable) return;

    // Ensure diagnostics array exists
    if (!document.diagnostics) {
      document.diagnostics = [];
    }

    this.logger.info(`Running validation for document: ${document.uri}`);

    if (document.uri.endsWith('.xxp')) {
      this.validateXxpDocument(document);
    } else if (document.uri.endsWith('.espace')) {
      this.validateEspaceDocument(document);
    }
  }

  private validateXxpDocument(document: Document): void {
    const workflows = document.symbolTable!.getNestedSymbolsOfTypeSync(WorkflowSymbol);

    for (const workflow of workflows) {
      this.validateWorkflowCircularDependency(workflow, new Set());
      this.validateTaskDefinitions(workflow);
      this.validateDataFlow(workflow);
    }
  }

  private validateEspaceDocument(document: Document): void {
    const experiments = document.symbolTable!.getNestedSymbolsOfTypeSync(ExperimentSymbol);

    for (const experiment of experiments) {
      this.validateExperimentStructure(experiment);
      this.validateSpaceWorkflowReferences(experiment);
      this.validateParameterDefinitions(experiment);
    }
  }

  private validateWorkflowCircularDependency(workflow: WorkflowSymbol, visited: Set<string>): void {
    if (visited.has(workflow.name)) {
      this.addValidationError(
        workflow,
        `Circular dependency detected in workflow inheritance: ${Array.from(visited).join(' -> ')} -> ${workflow.name}`,
        DiagnosticSeverity.Error
      );
      return;
    }

    visited.add(workflow.name);

    if (workflow.parentWorkflow) {
      this.validateWorkflowCircularDependency(workflow.parentWorkflow, new Set(visited));
    }
  }

  private validateTaskDefinitions(workflow: WorkflowSymbol): void {
    const tasks = workflow.getNestedSymbolsOfTypeSync(TaskSymbol);
    const taskNames = new Set<string>();

    for (const task of tasks) {
      // Check for duplicate task names
      if (taskNames.has(task.name)) {
        this.addValidationError(
          task,
          `Duplicate task name: ${task.name}`,
          DiagnosticSeverity.Error
        );
      }
      taskNames.add(task.name);

      // Check if task has implementation
      if (!task.implementation && task.name !== 'START' && task.name !== 'END') {
        this.addValidationError(
          task,
          `Task '${task.name}' requires an implementation`,
          DiagnosticSeverity.Warning
        );
      }

      // Validate parameter usage
      this.validateTaskParameters(task);
    }

    // Check for unused tasks
    this.validateTaskUsage(workflow, tasks);
  }

  private validateTaskParameters(task: TaskSymbol): void {
    // Check if required parameters are provided
    if (task.params.length === 0 && task.implementation) {
      this.addValidationError(
        task,
        `Task '${task.name}' may require parameters for implementation '${task.implementation}'`,
        DiagnosticSeverity.Information
      );
    }
  }

  private validateTaskUsage(workflow: WorkflowSymbol, tasks: TaskSymbol[]): void {
    // This would check if tasks are used in chains
    // Implementation depends on how chains are stored in the symbol table
    for (const task of tasks) {
      if (task.references.length === 0 && task.name !== 'START' && task.name !== 'END') {
        this.addValidationError(
          task,
          `Task '${task.name}' is defined but never used`,
          DiagnosticSeverity.Warning
        );
      }
    }
  }

  private validateDataFlow(workflow: WorkflowSymbol): void {
    const tasks = workflow.getNestedSymbolsOfTypeSync(TaskSymbol);
    const data = workflow.getNestedSymbolsOfTypeSync(DataSymbol);

    for (const task of tasks) {
      // Validate input data availability
      for (const inputData of task.inputs) {
        const dataSymbol = data.find(d => d.name === inputData);
        if (!dataSymbol) {
          this.addValidationError(
            task,
            `Input data '${inputData}' for task '${task.name}' is not defined`,
            DiagnosticSeverity.Error
          );
        }
      }

      // Check for circular data dependencies
      this.validateCircularDataDependencies(task, tasks, new Set());
    }
  }

  private validateCircularDataDependencies(
    task: TaskSymbol,
    allTasks: TaskSymbol[],
    visited: Set<string>
  ): void {
    if (visited.has(task.name)) {
      this.addValidationError(
        task,
        `Circular data dependency detected involving task: ${task.name}`,
        DiagnosticSeverity.Error
      );
      return;
    }

    visited.add(task.name);

    // Check tasks that depend on this task's outputs
    for (const otherTask of allTasks) {
      for (const input of otherTask.inputs) {
        if (task.outputs.includes(input)) {
          this.validateCircularDataDependencies(otherTask, allTasks, new Set(visited));
        }
      }
    }
  }

  private validateExperimentStructure(experiment: ExperimentSymbol): void {
    const spaces = experiment.getNestedSymbolsOfTypeSync(SpaceSymbol);

    if (spaces.length === 0) {
      this.addValidationError(
        experiment,
        'Experiment must define at least one space',
        DiagnosticSeverity.Warning
      );
    }

    // Validate space names are unique
    const spaceNames = new Set<string>();
    for (const space of spaces) {
      if (spaceNames.has(space.name)) {
        this.addValidationError(
          space,
          `Duplicate space name: ${space.name}`,
          DiagnosticSeverity.Error
        );
      }
      spaceNames.add(space.name);
    }
  }

  private validateSpaceWorkflowReferences(experiment: ExperimentSymbol): void {
    const spaces = experiment.getNestedSymbolsOfTypeSync(SpaceSymbol);

    for (const space of spaces) {
      // This would validate that the referenced workflow exists
      // Implementation depends on cross-file symbol resolution
      if (!space.workflowName) {
        this.addValidationError(
          space,
          `Space '${space.name}' must reference a workflow`,
          DiagnosticSeverity.Error
        );
      }
    }
  }

  private validateParameterDefinitions(experiment: ExperimentSymbol): void {
    const spaces = experiment.getNestedSymbolsOfTypeSync(SpaceSymbol);

    for (const space of spaces) {
      for (const [paramName, paramValue] of space.params.entries()) {
        this.validateParameterValue(space, paramName, paramValue);
      }
    }
  }

  private validateParameterValue(space: SpaceSymbol, paramName: string, paramValue: any): void {
    if (Array.isArray(paramValue)) {
      // Range parameter validation
      if (paramValue.length === 3) {
        const [min, max, step] = paramValue;
        if (typeof min !== 'number' || typeof max !== 'number' || typeof step !== 'number') {
          this.addValidationError(
            space,
            `Range parameter '${paramName}' must have numeric values`,
            DiagnosticSeverity.Error
          );
        }
        if (min >= max) {
          this.addValidationError(
            space,
            `Range parameter '${paramName}': minimum value must be less than maximum`,
            DiagnosticSeverity.Error
          );
        }
        if (step <= 0) {
          this.addValidationError(
            space,
            `Range parameter '${paramName}': step must be positive`,
            DiagnosticSeverity.Error
          );
        }
      } else if (paramValue.length < 1) {
        this.addValidationError(
          space,
          `Enum parameter '${paramName}' must have at least one value`,
          DiagnosticSeverity.Error
        );
      }
    }
  }

  private addValidationError(symbol: any, message: string, severity: DiagnosticSeverity): void {
    if (!symbol.context || !symbol.document) return;

    // Ensure diagnostics array exists
    if (!symbol.document.diagnostics) {
      symbol.document.diagnostics = [];
    }

    symbol.document.diagnostics.push({
      severity,
      range: {
        start: {
          line: symbol.context.start?.line - 1 || 0,
          character: symbol.context.start?.column || 0,
        },
        end: {
          line: symbol.context.stop?.line - 1 || 0,
          character: symbol.context.stop?.column + symbol.context.getText().length || 0,
        },
      },
      message,
      source: 'Validation',
    });
  }
}
