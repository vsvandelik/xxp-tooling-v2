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

interface ExperimentServiceConfig {
  databasePath: string;
  maxConcurrent: number;
}

interface PendingInput {
  request: UserInputRequest;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}

export class ExperimentService {
  private executor: ExperimentExecutor;
  private activeExperiments: Map<string, ActiveExperiment> = new Map();
  private pendingInputs: Map<string, PendingInput> = new Map();
  private config: ExperimentServiceConfig;

  constructor(config: ExperimentServiceConfig) {
    this.config = config;
    this.executor = new ExperimentExecutor(config.databasePath);
  }

  async initialize(): Promise<void> {
    // Initialize any required resources
    console.log('ExperimentService initialized');
  }

  async shutdown(): Promise<void> {
    // Terminate all active experiments
    for (const [id, experiment] of this.activeExperiments) {
      if (experiment.status.status === 'running') {
        await this.terminateExperiment(id);
      }
    }
    this.activeExperiments.clear();
    this.pendingInputs.clear();
  }

  async startExperiment(
    artifactPath: string,
    options: {
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

    const experimentId = this.generateExperimentId();

    // Create progress callback
    const progressCallback: ProgressCallback = {
      onTaskStart: (taskId, params) => {
        this.updateProgress(experimentId, { currentTask: taskId });
      },
      onTaskComplete: (taskId, params, outputs) => {
        // Progress will be updated by onProgress callback
      },
      onSpaceStart: spaceId => {
        this.updateProgress(experimentId, { currentSpace: spaceId });
      },
      onSpaceComplete: spaceId => {
        // Progress will be updated by onProgress callback
      },
      onError: (error, context) => {
        options.onError?.(error);
      },
      onProgress: (progress, message) => {
        const experiment = this.activeExperiments.get(experimentId);
        if (experiment) {
          const progressData: ExperimentProgress = {
            experimentId,
            status: experiment.status.status,
            ...(experiment.status.currentSpace && { currentSpace: experiment.status.currentSpace }),
            progress: {
              percentage: progress,
              completedSpaces: experiment.status.progress.completedSpaces,
              totalSpaces: experiment.status.progress.totalSpaces,
              completedTasks: Math.floor(
                progress * (experiment.status.progress.totalParameterSets || 1)
              ),
              totalTasks: experiment.status.progress.totalParameterSets || 1,
            },
            timestamp: Date.now(),
          };
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

      // Get initial status
      const status = await this.executor.getStatus(artifact.experiment, artifact.version);

      // Create active experiment record
      const activeExperiment: ActiveExperiment = {
        id: experimentId,
        experimentName: artifact.experiment,
        experimentVersion: artifact.version,
        artifactPath,
        status: status || {
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

  async getExperimentStatus(experimentId: string): Promise<RunStatus | null> {
    const experiment = this.activeExperiments.get(experimentId);
    if (!experiment) {
      return null;
    }

    return this.executor.getStatus(experiment.experimentName, experiment.experimentVersion);
  }

  async getExperimentHistory(
    experimentId: string,
    options?: {
      limit?: number;
      offset?: number;
      spaceId?: string;
      taskId?: string;
    }
  ): Promise<TaskHistoryItem[]> {
    // TODO: This would query the database for task execution history
    // For now, returning empty array - would need to extend DatabaseRepository
    return [];
  }

  submitUserInput(response: UserInputResponse): boolean {
    const pending = this.pendingInputs.get(response.requestId);
    if (!pending) {
      return false;
    }

    pending.resolve(response.value);
    this.pendingInputs.delete(response.requestId);
    return true;
  }

  getActiveExperiments(): ActiveExperiment[] {
    return Array.from(this.activeExperiments.values());
  }

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

  private generateExperimentId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async loadArtifact(artifactPath: string): Promise<any> {
    const fs = await import('fs');
    const content = fs.readFileSync(path.resolve(artifactPath), 'utf-8');
    return JSON.parse(content);
  }

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
