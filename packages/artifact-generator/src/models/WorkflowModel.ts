import { ExpressionType } from './ExperimentModel.js';

export class WorkflowModel {
  constructor(
    public name: string,
    public parentWorkflow: string | null,
    public tasks: TaskModel[],
    public data: DataModel[],
    public taskChain: TaskChain | null
  ) {}
}

export class TaskModel {
  public implementation: string | null = null;
  public parameters: ParameterModel[] = [];
  public inputs: string[] = [];
  public outputs: string[] = [];

  constructor(
    public name: string,
    public workflowName: string
  ) {}

  get isAbstract(): boolean {
    return this.implementation === null;
  }

  get id(): string {
    return `${this.workflowName}:${this.name}`;
  }
}

export class TaskConfigurationModel {
  constructor(
    public name: string,
    public implementation: string | null,
    public parameters: ParameterModel[],
    public inputs: string[],
    public outputs: string[]
  ) {}
}

export class ParameterModel {
  constructor(
    public name: string,
    public value: ExpressionType | null = null
  ) {}

  get isRequired(): boolean {
    return this.value === null;
  }
}

export class DataModel {
  constructor(public name: string) {}
}

export class TaskChain {
  constructor(public elements: ChainElement[]) {}

  getExecutionOrder(): string[] {
    return this.elements
      .filter(element => element.name !== 'START' && element.name !== 'END')
      .map(element => element.name);
  }
}

export class ChainElement {
  constructor(public name: string) {}
}
