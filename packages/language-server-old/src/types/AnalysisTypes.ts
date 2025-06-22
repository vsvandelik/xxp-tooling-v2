import { Range } from 'vscode-languageserver/node.js';
import { Symbol } from '../analysis/SymbolTable.js';

export interface DocumentAnalysis {
  uri: string;
  languageId: string;
  symbols: Symbol[];
  references: Reference[];
  imports: string[];
  workflow?: WorkflowAnalysis;
  experiment?: ExperimentAnalysis;
}

export interface Reference {
  name: string;
  type: string;
  scope: string;
  range: Range;
  isDefinition: boolean;
}

export interface WorkflowAnalysis {
  name: string;
  nameRange: Range;
  parentWorkflow?: string;
  parentWorkflowRange?: Range;
  tasks: TaskAnalysis[];
  data: DataAnalysis[];
  taskChain?: TaskChainAnalysis;
}

export interface TaskAnalysis {
  name: string;
  nameRange: Range;
  implementation?: string;
  implementationRange?: Range;
  parameters: ParameterAnalysis[];
  inputs: string[];
  outputs: string[];
  inputRanges?: Record<string, Range>;
  outputRanges?: Record<string, Range>;
}

export interface ParameterAnalysis {
  name: string;
  range: Range;
  required: boolean;
  hasDefault: boolean;
  defaultValue?: any;
}

export interface DataAnalysis {
  name: string;
  nameRange: Range;
  value?: string;
  valueRange?: Range;
}

export interface TaskChainAnalysis {
  elements: string[];
  elementRanges: Record<string, Range>;
  range: Range;
}

export interface ExperimentAnalysis {
  name: string;
  nameRange: Range;
  spaces: SpaceAnalysis[];
  dataDefinitions: DataAnalysis[];
  controlFlow?: ControlFlowAnalysis;
}

export interface SpaceAnalysis {
  name: string;
  nameRange: Range;
  workflowName: string;
  workflowNameRange: Range;
  strategy: string;
  strategyRange: Range;
  parameters: ParameterDefinitionAnalysis[];
  taskConfigurations: TaskConfigurationAnalysis[];
  dataDefinitions?: DataAnalysis[];
}

export interface ParameterDefinitionAnalysis {
  name: string;
  nameRange: Range;
  type: 'enum' | 'range' | 'value';
  values: any[];
  range: Range;
}

export interface TaskConfigurationAnalysis {
  taskName: string;
  taskNameRange: Range;
  parameters: ParameterDefinitionAnalysis[];
  range: Range;
}

export interface ControlFlowAnalysis {
  transitions: TransitionAnalysis[];
  range: Range;
}

export interface TransitionAnalysis {
  from: string;
  to: string;
  condition?: string;
  range: Range;
}
