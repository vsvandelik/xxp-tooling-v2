export type Expression = string | number;

export interface Task {
  taskId: string;
  workflow: string;
  implementation: string;
  dynamicParameters: string[];
  staticParameters: Record<string, Expression>;
  inputData: string[];
  outputData: string[];
}

export interface ParameterSet {
  [key: string]: Expression;
}

export interface Space {
  spaceId: string;
  tasksOrder: string[];
  parameters: ParameterSet[];
}

export interface Transition {
  from: string;
  to: string;
  condition?: string;
}

export interface Control {
  START: string;
  transitions: Transition[];
}

export interface Artifact {
  experiment: string;
  version: string;
  tasks: Task[][];
  spaces: Space[];
  control: Control;
}
