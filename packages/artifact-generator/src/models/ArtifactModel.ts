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
}

export class SpaceDefinition {
  constructor(
    public spaceId: string,
    public tasksOrder: string[],
    public parameters: Record<string, ExpressionType>[],
    public inputData: Record<string, string> = {}
  ) {}
}

export class ControlDefinition {
  constructor(
    public START: string,
    public transitions: TransitionDefinition[]
  ) {}
}

export class TransitionDefinition {
  constructor(
    public from: string,
    public to: string,
    public condition?: string
  ) {}
}
