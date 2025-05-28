export class ExperimentModel {
  constructor(
    public name: string,
    public spaces: SpaceModel[],
    public dataDefinitions: DataDefinition[],
    public controlFlow: ControlFlow | null = null
  ) {}
}

export class SpaceModel {
  constructor(
    public name: string,
    public workflowName: string,
    public strategy: string,
    public parameters: ParameterDefinition[],
    public taskConfigurations: TaskConfiguration[]
  ) {}
}

export type ExpressionType = number | string;

export class ParameterDefinition {
  constructor(
    public name: string,
    public type: 'enum' | 'range' | 'value',
    public values: ExpressionType[]
  ) {}
}

export class TaskConfiguration {
  constructor(
    public taskName: string,
    public parameters: ParameterDefinition[]
  ) {}
}

export class ControlFlow {
  constructor(public transitions: Transition[]) {}
}

export class Transition {
  constructor(
    public from: string,
    public to: string,
    public condition?: string
  ) {}
}

export class DataDefinition {
  constructor(
    public name: string,
    public value: string
  ) {}
}
