/**
 * Type definitions for experiment runner server.
 * Defines interfaces for server configuration, API requests/responses, and data structures.
 */

import { Expression, RunStatus } from '@extremexp/experiment-runner';

/**
 * Configuration options for the experiment runner server.
 */
export interface ServerConfig {
  /** Port number for the HTTP server */
  port: number;
  /** Enable verbose request logging */
  verbose?: boolean;
  /** Path to SQLite database file for storing experiment data */
  databasePath?: string;
  /** Maximum number of concurrent experiments allowed */
  maxConcurrent?: number;
}

/**
 * Request payload for starting a new experiment.
 */
export interface StartExperimentRequest {
  /** Path to the experiment artifact JSON file */
  artifactPath: string;
  /** Optional specific experiment ID to use */
  experimentId?: string;
  /** Whether to resume a previously interrupted experiment */
  resume?: boolean;
}

/**
 * Response from starting an experiment.
 */
export interface StartExperimentResponse {
  /** Unique identifier for the started experiment */
  experimentId: string;
  /** Status indicating how the experiment was started */
  status: 'started' | 'resumed' | 'error';
  /** Optional status message */
  message?: string;
}

/**
 * Request for user input during experiment execution.
 */
export interface UserInputRequest {
  /** Unique identifier for this input request */
  requestId: string;
  /** ID of the experiment requesting input */
  experimentId: string;
  /** Message prompt to display to the user */
  prompt: string;
  /** Timestamp when the request was created */
  timestamp: number;
}

/**
 * User's response to an input request.
 */
export interface UserInputResponse {
  /** ID of the request being responded to */
  requestId: string;
  /** User's input value */
  value: string;
}

/**
 * Progress update for an experiment.
 */
export interface ExperimentProgress {
  /** ID of the experiment being updated */
  experimentId: string;
  /** Current execution status */
  status: 'running' | 'completed' | 'failed' | 'terminated';
  /** Currently executing space ID */
  currentSpace?: string;
  /** Currently executing task ID */
  currentTask?: string;
  /** Detailed progress metrics */
  progress: {
    /** Overall completion percentage (0-1) */
    percentage: number;
    /** Number of completed spaces */
    completedSpaces: number;
    /** Total number of spaces */
    totalSpaces: number;
    /** Number of completed parameter sets */
    completedParameterSets: number;
    /** Total number of parameter sets */
    totalParameterSets: number;
    /** Number of completed tasks */
    completedTasks: number;
    /** Total number of tasks */
    totalTasks: number;
  };
  /** Timestamp of this progress update */
  timestamp: number;
}

/**
 * Historical record of a completed task execution.
 */
export interface TaskHistoryItem {
  /** ID of the executed task */
  taskId: string;
  /** ID of the space containing this task */
  spaceId: string;
  /** Index of the parameter set used */
  paramSetIndex: number;
  /** Input parameters for this execution */
  parameters: Record<string, Expression>;
  /** Output data produced by the task */
  outputs: Record<string, string>;
  /** Final status of the task execution */
  status: 'completed' | 'failed' | 'skipped';
  /** Timestamp when task execution started */
  startTime: number;
  /** Timestamp when task execution ended */
  endTime?: number;
  /** Error message if task failed */
  errorMessage?: string;
}

/**
 * Request for experiment execution history.
 */
export interface ExperimentHistoryRequest {
  /** ID of the experiment to query */
  experimentId: string;
  /** Maximum number of history items to return */
  limit?: number;
  /** Number of items to skip (for pagination) */
  offset?: number;
  /** Filter by specific space ID */
  spaceId?: string;
  /** Filter by specific task ID */
  taskId?: string;
}

/**
 * Response containing experiment execution history.
 */
export interface ExperimentHistoryResponse {
  /** ID of the queried experiment */
  experimentId: string;
  /** Array of task history items */
  tasks: TaskHistoryItem[];
  /** Total number of matching history items */
  total: number;
  /** Whether there are more items available */
  hasMore: boolean;
}

/**
 * Result of artifact validation.
 */
export interface ValidationResult {
  /** Array of validation error messages */
  errors: string[];
  /** Array of validation warning messages */
  warnings: string[];
  /** Whether the artifact passed validation */
  isValid: boolean;
}

/**
 * Request to generate an artifact from an ESPACE file.
 */
export interface GenerateArtifactRequest {
  /** Path to the ESPACE experiment definition file */
  espacePath: string;
  /** Optional output path for the generated artifact */
  outputPath?: string;
  /** If true, only validate without generating */
  validateOnly?: boolean;
}

/**
 * Response from artifact generation.
 */
export interface GenerateArtifactResponse {
  /** Whether generation was successful */
  success: boolean;
  /** Validation result for the artifact */
  validation: ValidationResult;
  /** Path to the generated artifact file */
  artifactPath?: string;
  /** Error message if generation failed */
  error?: string;
}

/**
 * Represents an active experiment being managed by the server.
 */
export interface ActiveExperiment {
  /** Unique identifier for this experiment instance */
  id: string;
  /** Name of the experiment from the artifact */
  experimentName: string;
  /** Version of the experiment from the artifact */
  experimentVersion: string;
  /** Path to the artifact file being executed */
  artifactPath: string;
  /** Current execution status and progress */
  status: RunStatus;
  /** Timestamp when the experiment was started */
  startTime: number;
  /** Optional WebSocket ID for client connection */
  socketId?: string;
}
