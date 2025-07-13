import { ExperimentModel, SpaceModel } from '../models/ExperimentModel.js';
import { WorkflowModel } from '../models/WorkflowModel.js';

import { ResolvedTask } from './TaskResolver.js';

export interface ResolvedData {
  experimentLevelData: Record<string, string>;
  spaceLevelData: Map<string, Record<string, string>>; // spaceId -> data overrides
}

export class DataResolver {
  resolve(
    experiment: ExperimentModel,
    workflows: WorkflowModel[],
    resolvedTasks: Map<string, ResolvedTask>
  ): ResolvedData {
    // Build workflow hierarchy map for inheritance resolution
    const workflowMap = this.buildWorkflowMap(workflows);

    // Get all initial input data requirements
    const requiredInitialInputs = this.getRequiredInitialInputs(resolvedTasks);

    // Resolve experiment-level data
    const experimentLevelData = this.resolveExperimentLevelData(experiment, workflowMap);

    // Resolve space-level data overrides
    const spaceLevelData = this.resolveSpaceLevelData(experiment);

    // Validate that all required initial inputs have values
    this.validateRequiredInputs(
      requiredInitialInputs,
      experimentLevelData,
      spaceLevelData,
      experiment.spaces
    );

    return {
      experimentLevelData,
      spaceLevelData,
    };
  }

  private buildWorkflowMap(workflows: WorkflowModel[]): Map<string, WorkflowModel> {
    const workflowMap = new Map<string, WorkflowModel>();
    for (const workflow of workflows) {
      workflowMap.set(workflow.name, workflow);
    }
    return workflowMap;
  }

  private getRequiredInitialInputs(resolvedTasks: Map<string, ResolvedTask>): Set<string> {
    const allInputs = new Set<string>();
    const allOutputs = new Set<string>();

    // Collect all inputs and outputs
    for (const task of resolvedTasks.values()) {
      task.inputs.forEach(input => allInputs.add(input));
      task.outputs.forEach(output => allOutputs.add(output));
    }

    // Initial inputs are those that are required as inputs but not produced as outputs
    const initialInputs = new Set<string>();
    for (const input of allInputs) {
      if (!allOutputs.has(input)) {
        initialInputs.add(input);
      }
    }

    return initialInputs;
  }

  private resolveExperimentLevelData(
    experiment: ExperimentModel,
    workflowMap: Map<string, WorkflowModel>
  ): Record<string, string> {
    const data: Record<string, string> = {};

    // Add experiment-level data definitions
    for (const dataDef of experiment.dataDefinitions) {
      data[dataDef.name] = dataDef.value;
    }

    // Add workflow-level data definitions (for workflows used in the experiment)
    const usedWorkflows = new Set(experiment.spaces.map(space => space.workflowName));
    for (const workflowName of usedWorkflows) {
      const workflowData = this.resolveWorkflowData(workflowName, workflowMap);

      // Workflow data has lower priority than experiment data
      for (const [name, value] of Object.entries(workflowData)) {
        if (!(name in data)) {
          data[name] = value;
        }
      }
    }

    return data;
  }

  private resolveWorkflowData(
    workflowName: string,
    workflowMap: Map<string, WorkflowModel>
  ): Record<string, string> {
    const data: Record<string, string> = {};
    const visited = new Set<string>();

    const resolveWorkflowRecursively = (name: string) => {
      if (visited.has(name)) return;
      visited.add(name);

      const workflow = workflowMap.get(name);
      if (!workflow) return;

      // First resolve parent workflow data
      if (workflow.parentWorkflow) {
        resolveWorkflowRecursively(workflow.parentWorkflow);
      }

      // Then add this workflow's data (child overrides parent)
      for (const dataModel of workflow.data) {
        if (dataModel.value !== null) {
          data[dataModel.name] = dataModel.value;
        }
      }
    };

    resolveWorkflowRecursively(workflowName);
    return data;
  }

  private resolveSpaceLevelData(experiment: ExperimentModel): Map<string, Record<string, string>> {
    const spaceLevelData = new Map<string, Record<string, string>>();

    for (const space of experiment.spaces) {
      const spaceData: Record<string, string> = {};

      // Add space-level data definitions
      for (const dataDef of space.dataDefinitions) {
        spaceData[dataDef.name] = dataDef.value;
      }

      // Only store if there are space-specific overrides
      if (Object.keys(spaceData).length > 0) {
        spaceLevelData.set(space.name, spaceData);
      }
    }

    return spaceLevelData;
  }

  private validateRequiredInputs(
    requiredInitialInputs: Set<string>,
    experimentLevelData: Record<string, string>,
    spaceLevelData: Map<string, Record<string, string>>,
    spaces: SpaceModel[]
  ): void {
    const errors: string[] = [];

    for (const space of spaces) {
      const spaceOverrides = spaceLevelData.get(space.name) || {};

      for (const inputName of requiredInitialInputs) {
        // Check if input has a value at space level or experiment level
        const hasSpaceValue = inputName in spaceOverrides;
        const hasExperimentValue = inputName in experimentLevelData;

        if (!hasSpaceValue && !hasExperimentValue) {
          errors.push(
            `Required initial input '${inputName}' is not defined for space '${space.name}'. ` +
              `Please define it at experiment level or space level.`
          );
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Data validation failed:\n${errors.join('\n')}`);
    }
  }
}
