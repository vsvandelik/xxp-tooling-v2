/**
 * @fileoverview Main entry point for the ExtremeXP experiment runner library.
 * Exports core execution engine and type definitions for running experiment artifacts.
 */

export { ExperimentExecutor } from './executors/ExperimentExecutor.js';
export { DatabaseRepository } from './database/DatabaseRepository.js';
export { SqliteRepository } from './database/SqliteRepository.js';

export { Expression, Space, Task } from './types/artifact.types.js';
export { RunStatus, RunResult } from './types/run.types.js';
export { ProgressCallback } from './types/progress.types.js';
export { ExperimentRunner, ExperimentRunnerOptions } from './types/runner.types.js';
export { UserInputProvider } from './userInput/UserInputProvider.js';
export { ConsoleInputProvider } from './userInput/ConsoleInputProvider.js';
