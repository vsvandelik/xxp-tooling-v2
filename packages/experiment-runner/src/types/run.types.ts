/**
 * @fileoverview Type definitions for experiment run results and status.
 * Defines interfaces for experiment execution outcomes and progress tracking.
 */

/**
 * Result of an experiment run containing final status and outputs.
 */
export interface RunResult {
  /** Unique identifier for the experiment run */
  runId: string;
  /** Final status of the experiment run */
  status: 'completed' | 'failed' | 'terminated';
  /** Error information if the run failed */
  error?: Error;
  /** Array of space IDs that completed successfully */
  completedSpaces: string[];
  /** Nested mapping of outputs: space ID -> output name -> file path */
  outputs: Record<string, Record<string, string>>;
  /** Summary statistics for the experiment run */
  summary: {
    /** Total number of tasks in the experiment */
    totalTasks: number;
    /** Number of tasks that completed successfully */
    completedTasks: number;
    /** Number of tasks that failed */
    failedTasks: number;
    /** Number of tasks that were skipped */
    skippedTasks: number;
  };
}

/**
 * Current status and progress information for a running or completed experiment.
 */
export interface RunStatus {
  /** Unique identifier for the experiment run */
  runId: string;
  /** Name of the experiment */
  experimentName: string;
  /** Version of the experiment */
  experimentVersion: string;
  /** Current execution status */
  status: 'running' | 'completed' | 'failed' | 'terminated';
  /** Currently executing space (if running) */
  currentSpace?: string;
  /** Current parameter set index within the current space (if running) */
  currentParameterSet?: number;
  /** Detailed progress information */
  progress: {
    /** Number of spaces completed */
    completedSpaces: number;
    /** Total number of spaces in the experiment */
    totalSpaces: number;
    /** Number of parameter sets completed */
    completedParameterSets: number;
    /** Total number of parameter sets in the experiment */
    totalParameterSets: number;
    /** Number of tasks completed */
    completedTasks: number;
    /** Total number of tasks in the experiment */
    totalTasks: number;
  };
}
