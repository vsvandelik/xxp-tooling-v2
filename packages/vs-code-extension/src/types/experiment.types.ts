/**
 * Type definitions for experiment execution and communication.
 * Defines interfaces for server configuration, experiment lifecycle, progress tracking,
 * user interaction, and API communication between VS Code extension and experiment server.
 */

import { Expression, RunStatus } from '@extremexp/experiment-runner';

/**
 * Configuration options for the experiment runner server.
 */
export interface ServerConfig {
  /** Port number for server communication */
  port: number;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Path to the experiment database file */
  databasePath?: string;
  /** Maximum number of concurrent experiments */
  maxConcurrent?: number;
}

/**
 * Request to start a new experiment execution.
 */
export interface StartExperimentRequest {
  /** Absolute path to the experiment artifact JSON file */
  artifactPath: string;
  /** Whether to resume a previously interrupted experiment */
  resume?: boolean;
}

/**
 * Response from experiment start request.
 */
export interface StartExperimentResponse {
  /** Unique identifier for the started experiment */
  experimentId: string;
  /** Status of the experiment start operation */
  status: 'started' | 'resumed' | 'error';
  /** Optional message providing additional information */
  message?: string;
}

/**
 * Request for user input during experiment execution.
 */
export interface UserInputRequest {
  /** Unique identifier for this input request */
  requestId: string;
  /** Experiment that is requesting user input */
  experimentId: string;
  /** Prompt message to display to the user */
  prompt: string;
  /** Timestamp when the input was requested */
  timestamp: number;
}

/**
 * Response to user input request.
 */
export interface UserInputResponse {
  /** Identifier matching the original input request */
  requestId: string;
  /** User-provided input value */
  value: string;
}

/**
 * Real-time progress information for running experiments.
 */
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

/**
 * Historical record of a completed task execution.
 */
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

/**
 * Request for experiment execution history with pagination.
 */
export interface ExperimentHistoryRequest {
  experimentId: string;
  limit?: number;
  offset?: number;
  spaceId?: string;
  taskId?: string;
}

/**
 * Response containing experiment execution history.
 */
export interface ExperimentHistoryResponse {
  experimentId: string;
  tasks: TaskHistoryItem[];
  total: number;
  hasMore: boolean;
}

/**
 * Result of artifact validation including errors and warnings.
 */
export interface ValidationResult {
  /** Array of validation error messages */
  errors: string[];
  /** Array of validation warning messages */
  warnings: string[];
  /** Whether the validation passed (no errors) */
  isValid: boolean;
}

/**
 * Request to generate executable artifact from ESPACE file.
 */
export interface GenerateArtifactRequest {
  espacePath: string;
  outputPath?: string;
  validateOnly?: boolean;
}

/**
 * Response from artifact generation including validation results.
 */
export interface GenerateArtifactResponse {
  success: boolean;
  validation: ValidationResult;
  artifactPath?: string;
  error?: string;
}

/**
 * Information about a currently active experiment.
 */
export interface ActiveExperiment {
  /** Unique identifier for the experiment */
  id: string;
  /** Name of the experiment */
  experimentName: string;
  /** Version of the experiment */
  experimentVersion: string;
  /** Path to the experiment artifact file */
  artifactPath: string;
  /** Current execution status */
  status: RunStatus;
  /** Timestamp when the experiment started */
  startTime: number;
  /** WebSocket connection identifier */
  socketId?: string;
}
