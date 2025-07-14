/**
 * Data models for ESPACE experiment definitions.
 * Contains models for parsed experiment structures including spaces, parameters, and control flow.
 */

/**
 * Root model representing a parsed ESPACE experiment.
 * Contains all experiment-level information including spaces, data, and control flow.
 */
export class ExperimentModel {
  /**
   * Creates a new experiment model.
   * 
   * @param name - Name of the experiment
   * @param spaces - Array of parameter spaces defined in the experiment
   * @param dataDefinitions - Experiment-level data definitions
   * @param controlFlow - Control flow definition (optional)
   */
  constructor(
    public name: string,
    public spaces: SpaceModel[],
    public dataDefinitions: DataDefinition[],
    public controlFlow: ControlFlow | null = null
  ) {}
}

/**
 * Represents a parameter space within an experiment.
 * Defines a specific workflow instance with strategy and parameter configurations.
 */
export class SpaceModel {
  /**
   * Creates a new space model.
   * 
   * @param name - Unique name of the space
   * @param workflowName - Name of the workflow this space uses
   * @param strategy - Parameter exploration strategy (gridsearch, randomsearch)
   * @param parameters - Space-level parameter definitions
   * @param taskConfigurations - Task-specific parameter configurations
   * @param dataDefinitions - Space-level data definitions
   */
  constructor(
    public name: string,
    public workflowName: string,
    public strategy: string,
    public parameters: ParameterDefinition[],
    public taskConfigurations: TaskConfiguration[],
    public dataDefinitions: DataDefinition[] = []
  ) {}
}

/**
 * Union type for all possible parameter and expression values.
 */
export type ExpressionType = number | string | boolean;

/**
 * Defines a parameter with its type and possible values.
 */
export class ParameterDefinition {
  /**
   * Creates a new parameter definition.
   * 
   * @param name - Name of the parameter
   * @param type - Type of parameter (enum, range, or single value)
   * @param values - Array of possible values or range specification
   */
  constructor(
    public name: string,
    public type: 'enum' | 'range' | 'value',
    public values: ExpressionType[]
  ) {}
}

/**
 * Defines task-specific parameter configurations within a space.
 */
export class TaskConfiguration {
  /**
   * Creates a new task configuration.
   * 
   * @param taskName - Name of the task to configure
   * @param parameters - Task-specific parameter definitions
   */
  constructor(
    public taskName: string,
    public parameters: ParameterDefinition[]
  ) {}
}

/**
 * Defines the control flow for an experiment.
 * Specifies how execution moves between parameter spaces.
 */
export class ControlFlow {
  /**
   * Creates a new control flow.
   * 
   * @param transitions - Array of transitions between spaces
   */
  constructor(public transitions: Transition[]) {}
}

/**
 * Defines a single transition in the experiment control flow.
 */
export class Transition {
  /**
   * Creates a new transition.
   * 
   * @param from - Source space name or 'START'
   * @param to - Target space name or 'END'
   * @param condition - Optional condition for conditional transitions
   */
  constructor(
    public from: string,
    public to: string,
    public condition?: string
  ) {}
}

/**
 * Defines a data element with its file path or value.
 */
export class DataDefinition {
  /**
   * Creates a new data definition.
   * 
   * @param name - Name of the data element
   * @param value - File path or data value
   */
  constructor(
    public name: string,
    public value: string
  ) {}
}
