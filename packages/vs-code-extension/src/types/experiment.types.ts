import { Expression, RunStatus } from '@extremexp/experiment-runner';

export interface ServerConfig {
  port: number;
  verbose?: boolean;
  databasePath?: string;
  maxConcurrent?: number;
}

export interface StartExperimentRequest {
  artifactPath: string;
  resume?: boolean;
}

export interface StartExperimentResponse {
  experimentId: string;
  status: 'started' | 'resumed' | 'error';
  message?: string;
}

export interface UserInputRequest {
  requestId: string;
  experimentId: string;
  prompt: string;
  timestamp: number;
}

export interface UserInputResponse {
  requestId: string;
  value: string;
}

export interface ExperimentProgress {
  experimentId: string;
  status: 'running' | 'completed' | 'failed' | 'terminated';
  currentSpace?: string;
  currentTask?: string;
  progress: {
    percentage: number;
    completedSpaces: number;
    totalSpaces: number;
    completedParameterSets: number;
    totalParameterSets: number;
    completedTasks: number;
    totalTasks: number;
  };
  timestamp: number;
}

export interface TaskHistoryItem {
  taskId: string;
  spaceId: string;
  paramSetIndex: number;
  parameters: Record<string, Expression>;
  outputs: Record<string, string>;
  status: 'completed' | 'failed' | 'skipped';
  startTime: number;
  endTime?: number;
  errorMessage?: string;
}

export interface ExperimentHistoryRequest {
  experimentId: string;
  limit?: number;
  offset?: number;
  spaceId?: string;
  taskId?: string;
}

export interface ExperimentHistoryResponse {
  experimentId: string;
  tasks: TaskHistoryItem[];
  total: number;
  hasMore: boolean;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export interface GenerateArtifactRequest {
  espacePath: string;
  outputPath?: string;
  validateOnly?: boolean;
}

export interface GenerateArtifactResponse {
  success: boolean;
  validation: ValidationResult;
  artifactPath?: string;
  error?: string;
}

export interface ActiveExperiment {
  id: string;
  experimentName: string;
  experimentVersion: string;
  artifactPath: string;
  status: RunStatus;
  startTime: number;
  socketId?: string;
}
