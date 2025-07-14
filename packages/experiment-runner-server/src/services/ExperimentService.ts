/**
 * @fileoverview Service for managing experiment execution in server environment.
 * Provides high-level interface for running multiple concurrent experiments with
 * progress tracking, user input handling, and state management.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import { spawn } from 'child_process';
import * as path from 'path';

import {
  ExperimentExecutor,
  ProgressCallback,
  UserInputProvider,
  RunResult,
  RunStatus,
  Expression,
  Space,
  Task,
} from '@extremexp/experiment-runner';

import {
  ActiveExperiment,
  ExperimentProgress,
  TaskHistoryItem,
  UserInputRequest,
  UserInputResponse,
  ValidationResult,
  GenerateArtifactResponse,
} from '../types/server.types.js';

/**
 * Configuration options for the experiment service.
 */
interface ExperimentServiceConfig {
  /** Path to the SQLite database file for storing experiment data */
  databasePath: string;
  /** Maximum number of concurrent experiments allowed */
  maxConcurrent: number;
}

/**
 * Represents a pending user input request.
 */
interface PendingInput {
  /** The user input request */
  request: UserInputRequest;
  /** Promise resolve function for the input value */
  resolve: (value: string) => void;
  /** Promise reject function for errors or timeouts */
  reject: (error: Error) => void;
}

/**
 * Service for managing experiment execution in a server environment.
 * Handles multiple concurrent experiments with progress tracking and user interaction.
 */
export class ExperimentService {
  private executor: ExperimentExecutor;
  private activeExperiments: Map<string, ActiveExperiment> = new Map();
  private pendingInputs: Map<string, PendingInput> = new Map();
  private config: ExperimentServiceConfig;

  /**
   * Creates a new experiment service.
   * 
   * @param config - Service configuration including database path and concurrency limits
   */
  constructor(config: ExperimentServiceConfig) {
    this.config = config;
    this.executor = new ExperimentExecutor(config.databasePath);
  }

  /**
   * Initializes the experiment service and database connection.
   * Must be called before using the service.
   * 
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    // Initialize the database connection once
    const repository = this.executor.getRepository();
    await repository.initialize();
    console.log('ExperimentService initialized');
  }

  /**
   * Shuts down the experiment service gracefully.
   * Terminates all running experiments and closes database connections.
   * 
   * @returns Promise that resolves when shutdown is complete
   */
  async shutdown(): Promise<void> {
    // Terminate all active experiments
    for (const [id, experiment] of this.activeExperiments) {
      if (experiment.status.status === 'running') {
        await this.terminateExperiment(id);
      }
    }
    this.activeExperiments.clear();
    this.pendingInputs.clear();

    // Close the database connection once
    const repository = this.executor.getRepository();
    await repository.close();
  }

  /**
   * Starts a new experiment execution or resumes an existing one.
   * 
   * @param artifactPath - Path to the experiment artifact JSON file
   * @param options - Execution options including callbacks and settings
   * @param options.experimentId - Optional specific experiment ID to use
   * @param options.resume - Whether to resume a previously interrupted experiment
   * @param options.onProgress - Callback for progress updates
   * @param options.onInputRequired - Callback for user input requests
   * @param options.onComplete - Callback for experiment completion
   * @param options.onError - Callback for experiment errors
   * @returns Promise resolving to the experiment ID
   * @throws Error if maximum concurrent experiments reached or experiment fails to start
   */
  async startExperiment(
    artifactPath: string,
    options: {
      experimentId?: string;
      resume?: boolean;
      onProgress?: (progress: ExperimentProgress) => void;
      onInputRequired?: (request: UserInputRequest) => void;
      onComplete?: (result: RunResult) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<string> {
    // Check concurrent limit
    const runningCount = Array.from(this.activeExperiments.values()).filter(
      exp => exp.status.status === 'running'
    ).length;

    if (runningCount >= this.config.maxConcurrent) {
      throw new Error(`Maximum concurrent experiments (${this.config.maxConcurrent}) reached`);
    }

    const experimentId = options.experimentId || this.generateExperimentId();

    // Create progress callback
    const progressCallback: ProgressCallback = {
      onTaskStart: (taskId, _params) => {
        this.updateProgress(experimentId, { currentTask: taskId });
      },
      onTaskComplete: (_taskId, _params, _outputs) => {
        // Progress will be updated by onProgress callback
      },
      onSpaceStart: spaceId => {
        this.updateProgress(experimentId, { currentSpace: spaceId });
      },
      onSpaceComplete: _spaceId => {
        // Progress will be updated by onProgress callback
      },
      onError: (error, _context) => {
        options.onError?.(error);
      },
      onProgress: async (progress, message) => {
        console.log(`Progress callback triggered: ${progress * 100}% - ${message}`);
        const experiment = this.activeExperiments.get(experimentId);
        if (experiment) {
          // Get fresh status from executor to get real-time progress numbers
          const freshStatus = await this.executor.getStatus(experiment.experimentName, experiment.experimentVersion);
          
          const progressData: ExperimentProgress = {
            experimentId,
            status: experiment.status.status,
            ...(experiment.status.currentSpace && { currentSpace: experiment.status.currentSpace }),
            progress: {
              percentage: progress,
              completedSpaces: freshStatus?.progress.completedSpaces || 0,
              totalSpaces: freshStatus?.progress.totalSpaces || experiment.status.progress.totalSpaces,
              completedParameterSets: freshStatus?.progress.completedParameterSets || 0,
              totalParameterSets: freshStatus?.progress.totalParameterSets || experiment.status.progress.totalParameterSets,
              completedTasks: freshStatus?.progress.completedTasks || 0,
              totalTasks: freshStatus?.progress.totalTasks || experiment.status.progress.totalTasks,
            },
            timestamp: Date.now(),
          };
          console.log(`Calling onProgress with data:`, progressData);
          options.onProgress?.(progressData);
        }
      },
    };

    // Create user input provider
    const userInputProvider: UserInputProvider = {
      getInput: async (prompt: string): Promise<string> => {
        const request: UserInputRequest = {
          requestId: this.generateRequestId(),
          experimentId,
          prompt,
          timestamp: Date.now(),
        };

        options.onInputRequired?.(request);

        return new Promise((resolve, reject) => {
          this.pendingInputs.set(request.requestId, {
            request,
            resolve,
            reject,
          });

          // Timeout after 5 minutes
          setTimeout(
            () => {
              if (this.pendingInputs.has(request.requestId)) {
                this.pendingInputs.delete(request.requestId);
                reject(new Error('User input timeout'));
              }
            },
            5 * 60 * 1000
          );
        });
      },
    };

    // Start experiment in background
    const runOptions = {
      resume: options.resume ?? false,
      progressCallback,
      userInputProvider,
      ...(options.onComplete && { onComplete: options.onComplete }),
      ...(options.onError && { onError: options.onError }),
    };

    this.runExperiment(experimentId, artifactPath, runOptions);

    return experimentId;
  }

  /**
   * Internal method to execute an experiment in the background.
   * Handles artifact loading, progress tracking, and status updates.
   * 
   * @param experimentId - Unique identifier for the experiment
   * @param artifactPath - Path to the experiment artifact file
   * @param options - Execution configuration and callbacks
   * @param options.resume - Whether this is resuming an interrupted experiment
   * @param options.progressCallback - Callback for progress events
   * @param options.userInputProvider - Provider for user input requests
   * @param options.onComplete - Optional completion callback
   * @param options.onError - Optional error callback
   * @returns Promise that resolves when experiment completes or fails
   */
  private async runExperiment(
    experimentId: string,
    artifactPath: string,
    options: {
      resume: boolean;
      progressCallback: ProgressCallback;
      userInputProvider: UserInputProvider;
      onComplete?: (result: RunResult) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<void> {
    try {
      // Load artifact to get experiment info
      const artifact = await this.loadArtifact(artifactPath);

      // Get initial status for progress tracking, but always start with 'running' status
      const existingStatus = await this.executor.getStatus(artifact.experiment, artifact.version);

      // Create active experiment record
      const activeExperiment: ActiveExperiment = {
        id: experimentId,
        experimentName: artifact.experiment,
        experimentVersion: artifact.version,
        artifactPath,
        status: existingStatus
          ? {
              ...existingStatus,
              status: 'running', // Always start with running status for new/resumed experiments
            }
          : {
              runId: experimentId,
              experimentName: artifact.experiment,
              experimentVersion: artifact.version,
              status: 'running',
              progress: {
                completedSpaces: 0,
                totalSpaces: artifact.spaces.length,
                completedParameterSets: 0,
                totalParameterSets: artifact.spaces.reduce(
                  (sum: number, space: { parameters: string | Expression[] }) =>
                    sum + space.parameters.length,
                  0
                ),
                completedTasks: 0,
                totalTasks: artifact.spaces.reduce(
                  (sum: number, space: { parameters: string | Expression[]; tasksOrder: string[] }) =>
                    sum + space.parameters.length * space.tasksOrder.length,
                  0
                ),
              },
            },
        startTime: Date.now(),
      };

      this.activeExperiments.set(experimentId, activeExperiment);

      // Run the experiment
      const result = await this.executor.run(artifactPath, {
        resume: options.resume,
        progressCallback: options.progressCallback,
        userInputProvider: options.userInputProvider,
      });

      // Update status
      activeExperiment.status.status = result.status;
      options.onComplete?.(result);
    } catch (error) {
      const experiment = this.activeExperiments.get(experimentId);
      if (experiment) {
        experiment.status.status = 'failed';
      }
      options.onError?.(error as Error);
    }
  }

  /**
   * Terminates a running experiment gracefully.
   * Stops execution and rejects any pending user input requests.
   * 
   * @param experimentId - ID of the experiment to terminate
   * @returns Promise resolving to true if terminated, false if experiment not found
   */
  async terminateExperiment(experimentId: string): Promise<boolean> {
    const experiment = this.activeExperiments.get(experimentId);
    if (!experiment) {
      return false;
    }

    const terminated = await this.executor.terminate(
      experiment.experimentName,
      experiment.experimentVersion
    );

    if (terminated) {
      experiment.status.status = 'terminated';
      // Reject any pending inputs
      for (const [requestId, pending] of this.pendingInputs) {
        if (pending.request.experimentId === experimentId) {
          pending.reject(new Error('Experiment terminated'));
          this.pendingInputs.delete(requestId);
        }
      }
    }

    return terminated;
  }

  /**
   * Gets the current status and progress of an experiment.
   * 
   * @param experimentId - ID of the experiment to query
   * @returns Promise resolving to current status or null if experiment not found
   */
  async getExperimentStatus(experimentId: string): Promise<RunStatus | null> {
    const experiment = this.activeExperiments.get(experimentId);
    if (!experiment) {
      return null;
    }

    return this.executor.getStatus(experiment.experimentName, experiment.experimentVersion);
  }

  /**
   * Retrieves the execution history for an experiment.
   * Returns detailed information about completed task executions.
   * 
   * @param experimentId - ID of the experiment to query
   * @param options - Optional filtering and pagination options
   * @param options.limit - Maximum number of history items to return
   * @param options.offset - Number of items to skip (for pagination)
   * @param options.spaceId - Filter by specific space ID
   * @param options.taskId - Filter by specific task ID
   * @returns Promise resolving to array of task history items
   * @throws Error if experiment not found
   */
  async getExperimentHistory(
    experimentId: string,
    options?: {
      limit?: number;
      offset?: number;
      spaceId?: string;
      taskId?: string;
    }
  ): Promise<TaskHistoryItem[]> {
    // Get the active experiment to find the experiment name and version
    const experiment = this.activeExperiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    // Get the repository from the executor (already initialized)
    const repository = this.executor.getRepository();

    // Get the run record using experiment name and version
    const run = await repository.getRun(experiment.experimentName, experiment.experimentVersion);
    if (!run) {
      return [];
    }

    // Get task execution history from the database
    const taskExecutions = await repository.getTaskExecutionHistory(run.id, options);

    // Load the artifact to get parameter sets and task information
    const artifact = await this.loadArtifact(experiment.artifactPath);

    // Map TaskExecutionRecord to TaskHistoryItem
    const historyItems: TaskHistoryItem[] = [];

    for (const execution of taskExecutions) {
      // Find the space containing this task execution
      const space = artifact.spaces.find((s: Space) => s.spaceId === execution.space_id);
      if (!space || !space.parameters[execution.param_set_index]) {
        continue; // Skip if space or parameter set not found
      }

      // Get the parameter set for this execution
      const parameterSet = space.parameters[execution.param_set_index];

      // Get output data for this task execution
      const outputs: Record<string, string> = {};

      // Find the task to get its output data names
      const allTasks = artifact.tasks.flat();
      const task = allTasks.find((t: Task) => t.taskId === execution.task_id);

      if (task) {
        // Retrieve each output data mapping
        for (const outputName of task.outputData) {
          const outputValue = await repository.getDataMapping(
            run.id,
            execution.space_id,
            execution.param_set_index,
            outputName
          );
          if (outputValue) {
            outputs[outputName] = outputValue;
          }
        }
      }

      const historyItem: TaskHistoryItem = {
        taskId: execution.task_id,
        spaceId: execution.space_id,
        paramSetIndex: execution.param_set_index,
        parameters: parameterSet,
        outputs,
        status: execution.status as 'completed' | 'failed' | 'skipped',
        startTime: execution.start_time || 0,
        ...(execution.end_time && { endTime: execution.end_time }),
        ...(execution.error_message && { errorMessage: execution.error_message }),
      };

      historyItems.push(historyItem);
    }

    return historyItems;
  }

  /**
   * Submits user input response to a pending input request.
   * 
   * @param response - User input response containing request ID and value
   * @returns True if input was successfully submitted, false if request not found
   */
  submitUserInput(response: UserInputResponse): boolean {
    const pending = this.pendingInputs.get(response.requestId);
    if (!pending) {
      return false;
    }

    pending.resolve(response.value);
    this.pendingInputs.delete(response.requestId);
    return true;
  }

  /**
   * Gets all currently active experiments.
   * 
   * @returns Array of active experiment objects
   */
  getActiveExperiments(): ActiveExperiment[] {
    return Array.from(this.activeExperiments.values());
  }

  /**
   * Updates progress tracking for an active experiment.
   * 
   * @param experimentId - ID of the experiment to update
   * @param updates - Progress updates to apply
   * @param updates.currentSpace - Current space being executed
   * @param updates.currentTask - Current task being executed
   */
  private updateProgress(
    experimentId: string,
    updates: Partial<{
      currentSpace: string;
      currentTask: string;
    }>
  ): void {
    const experiment = this.activeExperiments.get(experimentId);
    if (experiment && updates.currentSpace) {
      experiment.status.currentSpace = updates.currentSpace;
    }
    // Note: currentTask is not stored in RunStatus, only emitted in progress events
  }

  /**
   * Generates a unique experiment ID.
   * 
   * @returns Unique experiment identifier
   */
  private generateExperimentId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a unique request ID for user input requests.
   * 
   * @returns Unique request identifier
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Loads and parses an experiment artifact from a JSON file.
   * 
   * @param artifactPath - Path to the artifact JSON file
   * @returns Promise resolving to the parsed artifact object
   * @throws Error if file cannot be read or parsed
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async loadArtifact(artifactPath: string): Promise<any> {
    const fs = await import('fs');
    const content = fs.readFileSync(path.resolve(artifactPath), 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Validates an experiment artifact file for correctness.
   * Checks for required fields and basic structural integrity.
   * 
   * @param artifactPath - Path to the artifact JSON file to validate
   * @returns Promise resolving to validation result with errors and warnings
   */
  async validateArtifact(artifactPath: string): Promise<ValidationResult> {
    try {
      const artifact = await this.loadArtifact(artifactPath);

      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic validation
      if (!artifact.experiment) {
        errors.push('Missing experiment name');
      }
      if (!artifact.version) {
        errors.push('Missing experiment version');
      }
      if (!artifact.tasks || !Array.isArray(artifact.tasks)) {
        errors.push('Missing or invalid tasks array');
      }
      if (!artifact.spaces || !Array.isArray(artifact.spaces)) {
        errors.push('Missing or invalid spaces array');
      }
      if (!artifact.control?.START) {
        errors.push('Missing control flow START');
      }

      // Warnings
      if (artifact.spaces?.length === 0) {
        warnings.push('No spaces defined in artifact');
      }
      if (artifact.tasks?.length === 0) {
        warnings.push('No tasks defined in artifact');
      }

      return {
        errors,
        warnings,
        isValid: errors.length === 0,
      };
    } catch (error) {
      return {
        errors: [`Failed to load artifact: ${(error as Error).message}`],
        warnings: [],
        isValid: false,
      };
    }
  }

  /**
   * Generates an experiment artifact from an ESPACE file.
   * Spawns the artifact-generator CLI tool to process the ESPACE file.
   * 
   * @param espacePath - Path to the ESPACE experiment definition file
   * @param outputPath - Optional output path for the generated artifact
   * @returns Promise resolving to generation result with success status and validation
   */
  async generateArtifact(
    espacePath: string,
    outputPath?: string
  ): Promise<GenerateArtifactResponse> {
    return new Promise(resolve => {
      const args = [espacePath];
      if (outputPath) {
        args.push('-o', outputPath);
      }

      const proc = spawn('artifact-generator', args, {
        cwd: path.dirname(espacePath),
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', data => {
        stdout += data.toString();
      });

      proc.stderr.on('data', data => {
        stderr += data.toString();
      });

      proc.on('close', code => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Parse output for errors and warnings
        const lines = (stdout + stderr).split('\n');
        for (const line of lines) {
          if (line.includes('Validation error:') || line.includes('Error:')) {
            errors.push(line.replace(/^.*?Error:\s*/, ''));
          } else if (line.includes('Validation warning:') || line.includes('Warning:')) {
            warnings.push(line.replace(/^.*?Warning:\s*/, ''));
          }
        }

        const validation: ValidationResult = {
          errors: code === 0 ? errors : errors.length > 0 ? errors : ['Artifact generation failed'],
          warnings,
          isValid: code === 0 && errors.length === 0,
        };

        if (code === 0) {
          // Extract artifact path from output
          const pathMatch = stdout.match(/Artifact generated successfully:\s*(.+)/);
          const artifactPath = pathMatch ? pathMatch[1]!.trim() : undefined;

          const result: GenerateArtifactResponse = {
            success: true,
            validation,
          };

          if (artifactPath) {
            result.artifactPath = artifactPath;
          }

          resolve(result);
        } else {
          const result: GenerateArtifactResponse = {
            success: false,
            validation,
          };

          const errorMsg = stderr || 'Unknown error';
          if (errorMsg) {
            result.error = errorMsg;
          }

          resolve(result);
        }
      });

      proc.on('error', error => {
        resolve({
          success: false,
          validation: {
            errors: [`Failed to run artifact generator: ${error.message}`],
            warnings: [],
            isValid: false,
          },
          error: error.message,
        });
      });
    });
  }
}
