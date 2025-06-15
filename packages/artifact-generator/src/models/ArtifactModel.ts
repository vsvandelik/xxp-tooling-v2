import { ExpressionType } from './ExperimentModel.js';

export class ArtifactModel {
  constructor(
    public experiment: string,
    public version: string,
    public tasks: TaskDefinition[][],
    public spaces: SpaceDefinition[],
    public control: ControlDefinition,
    public inputData: Record<string, string> = {}
  ) {}

  toJSON(): Record<string, unknown> {
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

export class TaskDefinition {
  constructor(
    public taskId: string,
    public workflow: string,
    public implementation: string,
    public dynamicParameters: string[],
    public staticParameters: Record<string, ExpressionType>,
    public inputData: string[],
    public outputData: string[]
  ) {}

  toJSON(): Record<string, unknown> {
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

export class SpaceDefinition {
  constructor(
    public spaceId: string,
    public tasksOrder: string[],
    public parameters: Record<string, ExpressionType>[],
    public inputData: Record<string, string> = {}
  ) {}

  toJSON(): Record<string, unknown> {
    return {
      spaceId: this.spaceId,
      tasksOrder: [...this.tasksOrder],
      parameters: this.parameters.map(param => ({ ...param })),
      inputData: { ...this.inputData },
    };
  }
}

export class ControlDefinition {
  constructor(
    public START: string,
    public transitions: TransitionDefinition[]
  ) {}

  toJSON(): Record<string, unknown> {
    return {
      START: this.START,
      transitions: this.transitions.map(transition => transition.toJSON()),
    };
  }
}

export class TransitionDefinition {
  constructor(
    public from: string,
    public to: string,
    public condition?: string
  ) {}

  toJSON(): Record<string, unknown> {
    return {
      from: this.from,
      to: this.to,
      ...(this.condition !== undefined && { condition: this.condition }),
    };
  }
}
