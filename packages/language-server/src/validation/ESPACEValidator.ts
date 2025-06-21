// packages/language-server/src/validation/ESPACEValidator.ts
import { DocumentManager } from '../documents/DocumentManager.js';
import { ValidationResult } from '../types/ValidationTypes.js';
import { ParsedDocument } from '../types/ParsedDocument.js';

export class ESPACEValidator {
  constructor(private documentManager: DocumentManager) {}

  async validate(document: ParsedDocument): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    if (!document.analysis || document.languageId !== 'espace') {
      return results;
    }

    // Experiment-specific validations
    results.push(...this.validateWorkflowReferences(document));
    results.push(...this.validateControlFlow(document));
    results.push(...this.validateStrategies(document));
    results.push(...this.validateParameterUsage(document));
    results.push(...this.validateDataDefinitions(document));
    results.push(...this.validateSpaceConfigurations(document));

    return results;
  }

  private validateWorkflowReferences(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];
    const experiment = document.analysis?.experiment;

    if (!experiment) return results;

    const symbolTable = this.documentManager.getSymbolTable();

    for (const space of experiment.spaces) {
      const workflowSymbol = symbolTable.resolveSymbol(space.workflowName, 'global', 'workflow');

      if (!workflowSymbol) {
        results.push({
          severity: 'error',
          range: space.workflowNameRange,
          message: `Workflow '${space.workflowName}' referenced in space '${space.name}' not found`,
          code: 'espace-workflow-not-found',
        });
      }
    }

    return results;
  }

  private validateControlFlow(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];
    const experiment = document.analysis?.experiment;

    if (!experiment) return results;

    // Check if control flow is defined
    if (!experiment.controlFlow) {
      if (experiment.spaces.length > 0) {
        results.push({
          severity: 'error',
          range: experiment.nameRange,
          message: `The control flow of the experiment '${experiment.name}' is not defined`,
          code: 'espace-missing-control-flow',
        });
      }
      return results;
    }

    const definedSpaces = new Set(experiment.spaces.map(s => s.name));
    const referencedSpaces = new Set<string>();
    const reachableSpaces = new Set<string>();

    // Check for multiple START transitions
    const startTransitions = experiment.controlFlow.transitions.filter(t => t.from === 'START');

    if (startTransitions.length > 1) {
      results.push({
        severity: 'error',
        range: experiment.controlFlow.range,
        message: 'Multiple transitions from START are not allowed',
        code: 'espace-multiple-start-transitions',
      });
    }

    // Validate transitions
    for (const transition of experiment.controlFlow.transitions) {
      // Check for transitions from END
      if (transition.from === 'END') {
        results.push({
          severity: 'error',
          range: transition.range,
          message: 'Invalid control flow: transition from END is not allowed',
          code: 'espace-transition-from-end',
        });
      }

      // Check for self-loops
      if (
        transition.from === transition.to &&
        transition.from !== 'START' &&
        transition.from !== 'END'
      ) {
        results.push({
          severity: 'error',
          range: transition.range,
          message: `Self-loop detected in space '${transition.from}'`,
          code: 'espace-self-loop',
        });
      }

      // Check if referenced spaces exist
      for (const spaceName of [transition.from, transition.to]) {
        if (spaceName !== 'START' && spaceName !== 'END') {
          referencedSpaces.add(spaceName);

          if (!definedSpaces.has(spaceName)) {
            results.push({
              severity: 'error',
              range: transition.range,
              message: `Space '${spaceName}' referenced in control flow but not found`,
              code: 'espace-undefined-space',
            });
          }
        }
      }
    }

    // Check reachability
    if (startTransitions.length === 1) {
      this.findReachableSpaces('START', experiment.controlFlow.transitions, reachableSpaces);

      // Check if END is reachable
      const canReachEnd = this.canReachEnd('START', experiment.controlFlow.transitions, new Set());

      if (!canReachEnd) {
        results.push({
          severity: 'error',
          range: experiment.controlFlow.range,
          message: 'Control flow does not reach END - infinite loop detected',
          code: 'espace-unreachable-end',
        });
      }

      // Check for unreachable spaces
      for (const space of experiment.spaces) {
        if (!reachableSpaces.has(space.name)) {
          const severity = referencedSpaces.has(space.name) ? 'error' : 'warning';
          results.push({
            severity,
            range: space.nameRange,
            message: `Space '${space.name}' is defined but ${
              severity === 'error' ? 'unreachable' : 'not reachable'
            } in control flow`,
            code: 'espace-unreachable-space',
          });
        }
      }
    }

    return results;
  }

  private validateStrategies(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];
    const experiment = document.analysis?.experiment;

    if (!experiment) return results;

    const validStrategies = ['gridsearch', 'randomsearch'];

    for (const space of experiment.spaces) {
      if (!validStrategies.includes(space.strategy)) {
        results.push({
          severity: 'error',
          range: space.strategyRange,
          message: `Unknown strategy: ${space.strategy}`,
          code: 'espace-invalid-strategy',
        });
      }
    }

    return results;
  }

  private validateParameterUsage(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];
    const experiment = document.analysis?.experiment;

    if (!experiment) return results;

    const symbolTable = this.documentManager.getSymbolTable();

    for (const space of experiment.spaces) {
      const workflowInfo = symbolTable.getWorkflowInfo(space.workflowName);
      if (!workflowInfo) continue;

      const usedParams = new Set<string>();
      const definedParams = new Map<string, any>();

      // Collect parameters used by tasks in the workflow
      for (const task of workflowInfo.tasks) {
        for (const param of task.parameters) {
          usedParams.add(param.name);
        }
      }

      // Collect parameters defined in the space
      for (const param of space.parameters) {
        definedParams.set(param.name, param);
      }

      // Check for parameters defined but not used
      for (const [paramName, param] of definedParams) {
        if (!usedParams.has(paramName)) {
          results.push({
            severity: 'warning',
            range: param.range,
            message: `Parameter '${paramName}' is defined but never used`,
            code: 'espace-unused-parameter',
          });
        }
      }

      // Check for required parameters not provided
      for (const paramName of usedParams) {
        if (!definedParams.has(paramName)) {
          // Check if it's defined in task configurations
          const taskConfig = space.taskConfigurations.find(tc =>
            tc.parameters.some(p => p.name === paramName)
          );

          if (!taskConfig) {
            results.push({
              severity: 'error',
              range: space.nameRange,
              message: `Required parameter '${paramName}' not provided in space '${space.name}'`,
              code: 'espace-missing-parameter',
            });
          }
        }
      }
    }

    return results;
  }

  private validateDataDefinitions(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];
    const experiment = document.analysis?.experiment;

    if (!experiment) return results;

    const symbolTable = this.documentManager.getSymbolTable();

    // Check for required data inputs
    for (const space of experiment.spaces) {
      const workflowInfo = symbolTable.getWorkflowInfo(space.workflowName);
      if (!workflowInfo) continue;

      const requiredInputs = this.getRequiredInitialInputs(workflowInfo);
      const availableData = new Set<string>();

      // Add experiment-level data
      for (const data of experiment.dataDefinitions) {
        availableData.add(data.name);
      }

      // Add space-level data
      for (const data of space.dataDefinitions || []) {
        availableData.add(data.name);
      }

      // Check for missing inputs
      for (const input of requiredInputs) {
        if (!availableData.has(input)) {
          results.push({
            severity: 'error',
            range: space.nameRange,
            message: `Required initial input '${input}' is not defined for space '${space.name}'. Please define it at experiment level or space level.`,
            code: 'espace-missing-data-input',
          });
        }
      }
    }

    return results;
  }

  private validateSpaceConfigurations(document: ParsedDocument): ValidationResult[] {
    const results: ValidationResult[] = [];
    const experiment = document.analysis?.experiment;

    if (!experiment) return results;

    const symbolTable = this.documentManager.getSymbolTable();

    for (const space of experiment.spaces) {
      const workflowInfo = symbolTable.getWorkflowInfo(space.workflowName);
      if (!workflowInfo) continue;

      // Validate task configurations
      for (const taskConfig of space.taskConfigurations) {
        const task = workflowInfo.tasks.find(t => t.name === taskConfig.taskName);

        if (!task) {
          results.push({
            severity: 'error',
            range: taskConfig.range,
            message: `Task '${taskConfig.taskName}' not found in workflow '${space.workflowName}'`,
            code: 'espace-undefined-task-config',
          });
        }
      }
    }

    return results;
  }

  private findReachableSpaces(current: string, transitions: any[], reachable: Set<string>): void {
    if (current !== 'START' && current !== 'END') {
      reachable.add(current);
    }

    const outgoing = transitions.filter(t => t.from === current);
    for (const transition of outgoing) {
      if (!reachable.has(transition.to) && transition.to !== 'END') {
        this.findReachableSpaces(transition.to, transitions, reachable);
      }
    }
  }

  private canReachEnd(current: string, transitions: any[], visited: Set<string>): boolean {
    if (current === 'END') return true;
    if (visited.has(current)) return false;

    visited.add(current);

    const outgoing = transitions.filter(t => t.from === current);
    for (const transition of outgoing) {
      if (this.canReachEnd(transition.to, transitions, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  private getRequiredInitialInputs(workflowInfo: any): Set<string> {
    const allInputs = new Set<string>();
    const allOutputs = new Set<string>();

    for (const task of workflowInfo.tasks) {
      task.inputs.forEach((input: string) => allInputs.add(input));
      task.outputs.forEach((output: string) => allOutputs.add(output));
    }

    const initialInputs = new Set<string>();
    for (const input of allInputs) {
      if (!allOutputs.has(input)) {
        initialInputs.add(input);
      }
    }

    return initialInputs;
  }
}
