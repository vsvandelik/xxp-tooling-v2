/**
 * Type definitions for experiment runner interfaces and options.
 * Defines the main interfaces for experiment execution engines.
 */

import { UserInputProvider } from '../userInput/UserInputProvider.js';

import { ProgressCallback } from './progress.types.js';
import { RunResult, RunStatus } from './run.types.js';

/**
 * Configuration options for experiment execution.
 */
export interface ExperimentRunnerOptions {
  /** Callback interface for receiving progress updates */
  progressCallback?: ProgressCallback;
  /** Provider for handling user input requests during execution */
  userInputProvider?: UserInputProvider;
  /** Whether to resume a previously interrupted experiment */
  resume?: boolean;
  /** Maximum number of concurrent task executions (not currently implemented) */
  concurrency?: number;
}

/**
 * Main interface for experiment execution engines.
 * Defines the contract for running, monitoring, and controlling experiments.
 */
export interface ExperimentRunner {
  /**
   * Executes an experiment from an artifact file.
   *
   * @param artifactPath - Path to the experiment artifact JSON file
   * @param options - Optional execution configuration
   * @returns Promise resolving to the experiment run result
   */
  run(artifactPath: string, options?: ExperimentRunnerOptions): Promise<RunResult>;

  /**
   * Gets the current status of an experiment.
   *
   * @param experimentName - Name of the experiment
   * @param experimentVersion - Version of the experiment
   * @returns Promise resolving to the current status or null if not found
   */
  getStatus(experimentName: string, experimentVersion: string): Promise<RunStatus | null>;

  /**
   * Terminates a running experiment.
   *
   * @param experimentName - Name of the experiment to terminate
   * @param experimentVersion - Version of the experiment to terminate
   * @returns Promise resolving to true if terminated, false if not running
   */
  terminate(experimentName: string, experimentVersion: string): Promise<boolean>;
}
