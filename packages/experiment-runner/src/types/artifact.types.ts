export type Expression = string | number | boolean;

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
  inputData?: Record<string, string>;
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
  inputData?: Record<string, string>;
}
