import { RunResult, RunStatus } from './run.types.js';
import { ProgressCallback } from './progress.types.js';
import { UserInputProvider } from '../userInput/UserInputProvider.js';

export interface ExperimentRunnerOptions {
  progressCallback?: ProgressCallback;
  userInputProvider?: UserInputProvider;
  resume?: boolean;
  concurrency?: number;
}

export interface ExperimentRunner {
  run(artifactPath: string, options?: ExperimentRunnerOptions): Promise<RunResult>;
  getStatus(experimentName: string, experimentVersion: string): Promise<RunStatus | null>;
  terminate(experimentName: string, experimentVersion: string): Promise<boolean>;
}
