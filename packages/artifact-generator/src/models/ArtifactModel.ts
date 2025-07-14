/**
 * @fileoverview Data models for generated experiment artifacts.
 * Contains definitions for the final JSON structure of experiment artifacts.
 */

import { ExpressionType } from './ExperimentModel.js';

/**
 * Root model representing a complete experiment artifact.
 * Contains all necessary information to execute an experiment.
 */
export class ArtifactModel {
  /**
   * Creates a new experiment artifact.
   * 
   * @param experiment - Name of the experiment
   * @param version - Version of the artifact format
   * @param tasks - Array of task groups (parallel execution groups)
   * @param spaces - Array of parameter space definitions
   * @param control - Control flow definition for experiment execution
   * @param inputData - Global input data definitions
   */
  constructor(
    public experiment: string,
    public version: string,
    public tasks: TaskDefinition[][],
    public spaces: SpaceDefinition[],
    public control: ControlDefinition,
    public inputData: Record<string, string> = {}
  ) {}

  /**
   * Converts the artifact model to a JSON object.
   * 
   * @returns Plain JavaScript object representation of the artifact
   */
  toJSON(): any {
    return {
      experiment: this.experiment,
      version: this.version,
      tasks: this.tasks.map(taskGroup => taskGroup.map(task => task.toJSON())),
      spaces: this.spaces.map(space => space.toJSON()),
      control: this.control.toJSON(),
      inputData: this.inputData,
    };
  }
}

/**
 * Defines a single task within an experiment artifact.
 * Contains all information needed to execute a specific task.
 */
export class TaskDefinition {
  /**
   * Creates a new task definition.
   * 
   * @param taskId - Unique identifier for the task
   * @param workflow - Name of the workflow this task belongs to
   * @param implementation - Path to the task implementation file
   * @param dynamicParameters - Parameters that vary across experiment runs
   * @param staticParameters - Parameters with fixed values
   * @param inputData - Data inputs required by this task
   * @param outputData - Data outputs produced by this task
   */
  constructor(
    public taskId: string,
    public workflow: string,
    public implementation: string,
    public dynamicParameters: string[],
    public staticParameters: Record<string, ExpressionType>,
    public inputData: string[],
    public outputData: string[]
  ) {}

  /**
   * Converts the task definition to a JSON object.
   * 
   * @returns Plain JavaScript object representation of the task
   */
  toJSON(): any {
    return {
      taskId: this.taskId,
      workflow: this.workflow,
      implementation: this.implementation,
      dynamicParameters: [...this.dynamicParameters],
      staticParameters: { ...this.staticParameters },
      inputData: [...this.inputData],
      outputData: [...this.outputData],
    };
  }
}

/**
 * Defines a parameter space within an experiment.
 * Contains task execution order and parameter value combinations.
 */
export class SpaceDefinition {
  /**
   * Creates a new space definition.
   * 
   * @param spaceId - Unique identifier for the space
   * @param tasksOrder - Ordered list of task IDs to execute in this space
   * @param parameters - Array of parameter value combinations for this space
   * @param inputData - Space-specific input data definitions
   */
  constructor(
    public spaceId: string,
    public tasksOrder: string[],
    public parameters: Record<string, ExpressionType>[],
    public inputData: Record<string, string> = {}
  ) {}

  /**
   * Converts the space definition to a JSON object.
   * 
   * @returns Plain JavaScript object representation of the space
   */
  toJSON(): any {
    return {
      spaceId: this.spaceId,
      tasksOrder: [...this.tasksOrder],
      parameters: this.parameters.map(param => ({ ...param })),
      inputData: { ...this.inputData },
    };
  }
}

/**
 * Defines the control flow for experiment execution.
 * Specifies how to navigate between parameter spaces.
 */
export class ControlDefinition {
  /**
   * Creates a new control flow definition.
   * 
   * @param START - Initial space ID to start experiment execution
   * @param transitions - Array of transitions between spaces
   */
  constructor(
    public START: string,
    public transitions: TransitionDefinition[]
  ) {}

  /**
   * Converts the control definition to a JSON object.
   * 
   * @returns Plain JavaScript object representation of the control flow
   */
  toJSON(): any {
    return {
      START: this.START,
      transitions: this.transitions.map(transition => transition.toJSON()),
    };
  }
}

/**
 * Defines a single transition in the experiment control flow.
 * Specifies movement from one space to another, optionally with conditions.
 */
export class TransitionDefinition {
  /**
   * Creates a new transition definition.
   * 
   * @param from - Source space ID or 'START'
   * @param to - Target space ID or 'END'
   * @param condition - Optional condition for conditional transitions
   */
  constructor(
    public from: string,
    public to: string,
    public condition?: string
  ) {}

  /**
   * Converts the transition definition to a JSON object.
   * 
   * @returns Plain JavaScript object representation of the transition
   */
  toJSON(): any {
    return {
      from: this.from,
      to: this.to,
      ...(this.condition !== undefined && { condition: this.condition }),
    };
  }
}
