/**
 * @fileoverview Data models for XXP workflow definitions.
 * Contains models for parsed workflow structures including tasks, data, and inheritance.
 */

import { ExpressionType } from './ExperimentModel.js';

/**
 * Root model representing a parsed XXP workflow.
 * Contains all workflow-level information including tasks, data, and inheritance relationships.
 */
export class WorkflowModel {
  /**
   * Creates a new workflow model.
   * 
   * @param name - Name of the workflow
   * @param parentWorkflow - Name of parent workflow for inheritance (null if no parent)
   * @param tasks - Array of task definitions
   * @param data - Array of data definitions
   * @param taskChain - Execution order specification (null if no chain defined)
   * @param taskConfigurations - Array of task configuration overrides
   */
  constructor(
    public name: string,
    public parentWorkflow: string | null,
    public tasks: TaskModel[],
    public data: DataModel[],
    public taskChain: TaskChain | null,
    public taskConfigurations: TaskConfigurationModel[] = []
  ) {}
}

/**
 * Represents a task definition within a workflow.
 * Contains task metadata, parameters, and I/O specifications.
 */
export class TaskModel {
  /** Path to the task implementation file (null for abstract tasks) */
  public implementation: string | null = null;
  /** Array of parameter definitions for this task */
  public parameters: ParameterModel[] = [];
  /** Array of input data names required by this task */
  public inputs: string[] = [];
  /** Array of output data names produced by this task */
  public outputs: string[] = [];

  /**
   * Creates a new task model.
   * 
   * @param name - Name of the task
   * @param workflowName - Name of the workflow this task belongs to
   */
  constructor(
    public name: string,
    public workflowName: string
  ) {}

  /**
   * Determines if this task is abstract (has no implementation).
   * 
   * @returns True if the task has no implementation
   */
  get isAbstract(): boolean {
    return this.implementation === null;
  }

  /**
   * Gets the unique identifier for this task.
   * 
   * @returns Task ID in format 'workflowName:taskName'
   */
  get id(): string {
    return `${this.workflowName}:${this.name}`;
  }
}

/**
 * Represents a task configuration override within a workflow.
 * Used to configure specific implementation, parameters, and I/O for tasks.
 */
export class TaskConfigurationModel {
  /**
   * Creates a new task configuration.
   * 
   * @param name - Name of the task to configure
   * @param implementation - Implementation file path override (null to keep existing)
   * @param parameters - Parameter overrides for this task
   * @param inputs - Input data override for this task
   * @param outputs - Output data override for this task
   */
  constructor(
    public name: string,
    public implementation: string | null,
    public parameters: ParameterModel[],
    public inputs: string[],
    public outputs: string[]
  ) {}
}

/**
 * Represents a parameter definition within a task.
 * Can have a default value or be required (null value).
 */
export class ParameterModel {
  /**
   * Creates a new parameter model.
   * 
   * @param name - Name of the parameter
   * @param value - Default value for the parameter (null if required)
   */
  constructor(
    public name: string,
    public value: ExpressionType | null = null
  ) {}

  /**
   * Determines if this parameter is required (has no default value).
   * 
   * @returns True if the parameter is required
   */
  get isRequired(): boolean {
    return this.value === null;
  }
}

/**
 * Represents a data definition within a workflow.
 * Can have an initial value or be abstract (null value).
 */
export class DataModel {
  /**
   * Creates a new data model.
   * 
   * @param name - Name of the data element
   * @param value - Initial file path or value (null if abstract)
   */
  constructor(
    public name: string,
    public value: string | null = null
  ) {}
}

/**
 * Represents the execution chain for tasks within a workflow.
 * Defines the order in which tasks should be executed.
 */
export class TaskChain {
  /**
   * Creates a new task chain.
   * 
   * @param elements - Array of chain elements defining execution order
   */
  constructor(public elements: ChainElement[]) {}

  /**
   * Gets the execution order of tasks, excluding START and END markers.
   * 
   * @returns Array of task names in execution order
   */
  getExecutionOrder(): string[] {
    return this.elements
      .filter(element => element.name !== 'START' && element.name !== 'END')
      .map(element => element.name);
  }
}

/**
 * Represents a single element in a task execution chain.
 * Can be a task name or special markers (START, END).
 */
export class ChainElement {
  /**
   * Creates a new chain element.
   * 
   * @param name - Name of the task or special marker (START/END)
   */
  constructor(public name: string) {}
}
