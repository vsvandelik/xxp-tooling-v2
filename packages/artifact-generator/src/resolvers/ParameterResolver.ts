import {
  ExperimentModel,
  SpaceModel,
  ParameterDefinition,
  ExpressionType,
} from '../models/ExperimentModel.js';
import { WorkflowModel } from '../models/WorkflowModel.js';

export interface ParameterCombination {
  spaceId: string;
  combinations: Record<string, ExpressionType>[];
}

export class ParameterResolver {
  resolve(experiment: ExperimentModel, workflows?: WorkflowModel[]): ParameterCombination[] {
    const results: ParameterCombination[] = [];

    for (const space of experiment.spaces) {
      const combinations = this.generateParameterCombinations(space, workflows);
      results.push({
        spaceId: space.name,
        combinations,
      });
    }

    return results;
  }

  private generateParameterCombinations(space: SpaceModel, workflows?: WorkflowModel[]): Record<string, ExpressionType>[] {
    const parameterSets = this.collectParameterSets(space, workflows);

    if (space.strategy === 'gridsearch') {
      return this.generateGridSearchCombinations(parameterSets);
    } else if (space.strategy === 'randomsearch') {
      return this.generateRandomSearchCombinations(parameterSets);
    } else {
      throw new Error(`Unknown strategy: ${space.strategy}`);
    }
  }

  private collectParameterSets(space: SpaceModel, workflows?: WorkflowModel[]): Map<string, ExpressionType[]> {
    const parameterSets = new Map<string, ExpressionType[]>();

    // If workflows are provided, filter parameters to only include those used by tasks
    let usedParameterNames: Set<string> | undefined;
    if (workflows) {
      usedParameterNames = this.getUsedParameterNames(space, workflows);
    }

    // Collect space-level parameters (filter if workflows provided)
    for (const param of space.parameters) {
      if (!usedParameterNames || usedParameterNames.has(param.name)) {
        parameterSets.set(param.name, this.expandParameterValues(param));
      }
    }

    // Collect task-level parameters with prefixed names
    for (const taskConfig of space.taskConfigurations) {
      for (const param of taskConfig.parameters) {
        const prefixedName = `${taskConfig.taskName}:${param.name}`;
        parameterSets.set(prefixedName, this.expandParameterValues(param));
      }
    }

    return parameterSets;
  }

  private getUsedParameterNames(space: SpaceModel, workflows: WorkflowModel[]): Set<string> {
    const usedParameterNames = new Set<string>();
    
    // Find the workflow for this space
    const workflow = workflows.find(w => w.name === space.workflowName);
    if (workflow) {
      // Resolve the complete inheritance chain first
      const workflowMap = new Map<string, WorkflowModel>();
      workflows.forEach(w => workflowMap.set(w.name, w));
      
      const resolvedWorkflow = this.resolveWorkflowInheritance(workflow, workflowMap);
      
      // Collect all parameter names defined by tasks in the resolved workflow
      for (const task of resolvedWorkflow.tasks) {
        for (const param of task.parameters) {
          usedParameterNames.add(param.name);
        }
      }
    }
    
    return usedParameterNames;
  }

  private resolveWorkflowInheritance(workflow: WorkflowModel, workflowMap: Map<string, WorkflowModel>): WorkflowModel {
    if (!workflow.parentWorkflow) {
      // Apply configurations to workflows without parents  
      const result = {
        ...workflow,
        tasks: [...workflow.tasks]
      };
      
      for (const config of workflow.taskConfigurations) {
        const task = result.tasks.find(t => t.name === config.name);
        if (task) {
          if (config.implementation !== null) {
            task.implementation = config.implementation;
          }
          task.parameters = [...task.parameters, ...config.parameters];
          if (config.inputs.length > 0) {
            task.inputs = config.inputs;
          }
          if (config.outputs.length > 0) {
            task.outputs = config.outputs;
          }
        }
      }
      
      return result;
    }

    const parentWorkflow = workflowMap.get(workflow.parentWorkflow);
    if (!parentWorkflow) {
      throw new Error(`Parent workflow '${workflow.parentWorkflow}' not found`);
    }

    const resolvedParent = this.resolveWorkflowInheritance(parentWorkflow, workflowMap);

    // Merge parent tasks with current workflow tasks
    const mergedTasks = [...resolvedParent.tasks];

    // Apply task configurations to merge parameters
    for (const config of workflow.taskConfigurations) {
      const existingTask = mergedTasks.find(t => t.name === config.name);
      if (existingTask) {
        // Merge parameters (current config parameters override parent)
        existingTask.parameters = [...existingTask.parameters, ...config.parameters];
        if (config.implementation !== null) {
          existingTask.implementation = config.implementation;
        }
        if (config.inputs.length > 0) {
          existingTask.inputs = config.inputs;
        }
        if (config.outputs.length > 0) {
          existingTask.outputs = config.outputs;
        }
      }
    }

    // Add new tasks from current workflow
    for (const task of workflow.tasks) {
      if (!mergedTasks.find(t => t.name === task.name)) {
        mergedTasks.push(task);
      }
    }

    return {
      name: workflow.name,
      parentWorkflow: workflow.parentWorkflow,
      tasks: mergedTasks,
      data: [...resolvedParent.data, ...workflow.data],
      taskChain: workflow.taskChain || resolvedParent.taskChain,
      taskConfigurations: workflow.taskConfigurations,
    };
  }

  private expandParameterValues(param: ParameterDefinition): ExpressionType[] {
    switch (param.type) {
      case 'enum':
        return param.values;

      case 'range': {
        if (param.values.length !== 3) {
          throw new Error(`Range parameter must have exactly 3 values, got ${param.values.length}`);
        }

        const [min, max, step] = param.values;
        if (typeof min !== 'number' || typeof max !== 'number' || typeof step !== 'number') {
          throw new Error('Range parameter values must be numbers');
        }

        const values: number[] = [];
        for (let value = min; value <= max; value += step) {
          // Handle floating point precision issues
          values.push(Math.round(value * 10000) / 10000);
        }
        return values;
      }

      case 'value':
        return [param.values[0]!];

      default:
        throw new Error(`Unknown parameter type: ${param.type}`);
    }
  }

  private generateGridSearchCombinations(
    parameterSets: Map<string, ExpressionType[]>
  ): Record<string, ExpressionType>[] {
    const paramNames = Array.from(parameterSets.keys());
    const paramValues = paramNames.map(name => parameterSets.get(name)!);

    if (paramNames.length === 0) {
      return [{}];
    }

    const combinations: Record<string, ExpressionType>[] = [];

    const generateCombination = (index: number, current: Record<string, ExpressionType>) => {
      if (index === paramNames.length) {
        combinations.push({ ...current });
        return;
      }

      const paramName = paramNames[index]!;
      const values = paramValues[index]!;

      for (const value of values) {
        current[paramName] = value;
        generateCombination(index + 1, current);
      }
    };

    generateCombination(0, {});
    return combinations;
  }

  private generateRandomSearchCombinations(
    parameterSets: Map<string, ExpressionType[]>,
    count: number = 10
  ): Record<string, ExpressionType>[] {
    const paramNames = Array.from(parameterSets.keys());
    const combinations: Record<string, ExpressionType>[] = [];

    for (let i = 0; i < count; i++) {
      const combination: Record<string, ExpressionType> = {};

      for (const paramName of paramNames) {
        const values = parameterSets.get(paramName)!;
        const randomIndex = Math.floor(Math.random() * values.length);
        combination[paramName] = values[randomIndex]!;
      }

      combinations.push(combination);
    }

    return combinations;
  }
}
