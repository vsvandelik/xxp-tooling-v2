/**
 * Task executor for individual task execution.
 * Handles the execution of individual tasks with parameter resolution,
 * input/output data management, and subprocess execution.
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';

import { DatabaseRepository } from '../database/DatabaseRepository.js';
import { ProgressEmitter } from '../progress/ProgressEmitter.js';
import { Task, ParameterSet, Expression, Artifact } from '../types/artifact.types.js';

/**
 * Executor responsible for running individual tasks within parameter sets.
 * Manages task execution including parameter resolution, input/output data
 * handling, subprocess spawning, and result collection.
 */
export class TaskExecutor {
  private artifact: Artifact | null = null;
  private pythonExecutable: string | null = null;

  /**
   * Creates a new task executor.
   *
   * @param repository - Database repository for persistence
   * @param artifactFolder - Base folder path for resolving relative paths
   * @param progress - Progress emitter for status updates
   */
  constructor(
    private repository: DatabaseRepository,
    private artifactFolder: string,
    private progress: ProgressEmitter
  ) {}

  /**
   * Sets the artifact context for parameter resolution.
   *
   * @param artifact - Experiment artifact containing global data definitions
   */
  setArtifact(artifact: Artifact): void {
    this.artifact = artifact;
  }

  /**
   * Executes a single task with the given parameters.
   * Handles task lifecycle including status tracking, parameter resolution,
   * subprocess execution, and output collection.
   *
   * @param runId - Unique identifier for the experiment run
   * @param spaceId - Space identifier containing this task
   * @param paramSetIndex - Index of the parameter set being executed
   * @param task - Task definition to execute
   * @param paramSet - Parameter values for this execution
   * @returns Promise resolving to output data mappings
   * @throws Error if task execution fails or parameters cannot be resolved
   */
  async execute(
    runId: string,
    spaceId: string,
    paramSetIndex: number,
    task: Task,
    paramSet: ParameterSet
  ): Promise<Record<string, string>> {
    // Check if already executed
    const existing = await this.repository.getTaskExecution(
      runId,
      spaceId,
      paramSetIndex,
      task.taskId
    );
    if (existing?.status === 'completed') {
      // TODO: Replace with enum
      // Return existing outputs
      const outputs: Record<string, string> = {};
      for (const outputName of task.outputData) {
        const value = await this.repository.getDataMapping(
          runId,
          spaceId,
          paramSetIndex,
          outputName
        );
        if (value) outputs[outputName] = value;
      }
      return outputs;
    }

    // Prepare parameters
    const allParams = this.resolveParameters(task, paramSet);

    this.progress.emitTaskStart(task.taskId, allParams);

    // Create task execution record
    await this.repository.createTaskExecution({
      run_id: runId,
      space_id: spaceId,
      param_set_index: paramSetIndex,
      task_id: task.taskId,
      status: 'running',
      start_time: Date.now(),
    });
    try {
      // Resolve input data
      const inputData = await this.resolveInputData(runId, spaceId, paramSetIndex, task.inputData);

      // Execute task and get output data
      const outputData = await this.runPythonScript(
        task.implementation,
        allParams,
        inputData,
        task
      );

      // Store output mappings using the data returned by the script
      const outputs: Record<string, string> = {};
      for (const [outputName, outputValue] of Object.entries(outputData)) {
        outputs[outputName] = outputValue;
        await this.repository.createDataMapping({
          run_id: runId,
          space_id: spaceId,
          param_set_index: paramSetIndex,
          data_name: outputName,
          data_value: outputValue,
        });
      }
      // Update task execution record - outputs are determined by script
      await this.repository.updateTaskExecution(runId, spaceId, paramSetIndex, task.taskId, {
        status: 'completed',
        end_time: Date.now(),
      });

      this.progress.emitTaskComplete(task.taskId, allParams, outputs);
      return outputs;
    } catch (error) {
      // Update task execution record with error
      await this.repository.updateTaskExecution(runId, spaceId, paramSetIndex, task.taskId, {
        status: 'failed',
        end_time: Date.now(),
        error_message: (error as Error).message,
      });

      this.progress.emitError(error as Error, { taskId: task.taskId, params: allParams });
      throw error;
    }
  }

  private resolveParameters(task: Task, paramSet: ParameterSet): Record<string, Expression> {
    const params = { ...task.staticParameters };

    // Get the simple task name (part after the colon in taskId like "AlgorithmA:postProcessing" -> "postProcessing")
    const simpleTaskName = task.taskId.includes(':')
      ? task.taskId.split(':')[1] || task.taskId
      : task.taskId;

    // First, handle dynamic parameters
    for (const dynParam of task.dynamicParameters) {
      // Check for task-specific override with full task ID
      const fullOverrideKey = `${task.taskId}:${dynParam}`;
      // Check for task-specific override with simple task name
      const simpleOverrideKey = `${simpleTaskName}:${dynParam}`;

      if (fullOverrideKey in paramSet) {
        params[dynParam] = paramSet[fullOverrideKey]!;
      } else if (simpleOverrideKey in paramSet) {
        params[dynParam] = paramSet[simpleOverrideKey]!;
      } else if (dynParam in paramSet) {
        params[dynParam] = paramSet[dynParam]!;
      }
    }

    // Then, handle static parameter overrides from space
    for (const staticParam of Object.keys(task.staticParameters)) {
      // Check for task-specific override with full task ID
      const fullOverrideKey = `${task.taskId}:${staticParam}`;
      // Check for task-specific override with simple task name
      const simpleOverrideKey = `${simpleTaskName}:${staticParam}`;

      if (fullOverrideKey in paramSet) {
        params[staticParam] = paramSet[fullOverrideKey]!;
      } else if (simpleOverrideKey in paramSet) {
        params[staticParam] = paramSet[simpleOverrideKey]!;
      } else if (staticParam in paramSet) {
        params[staticParam] = paramSet[staticParam]!;
      }
    }

    // Finally, check for any task-specific parameters that might not be in static/dynamic lists
    // This handles cases where parameters are defined in the space but not in the task definition
    for (const [key, value] of Object.entries(paramSet)) {
      if (key.startsWith(`${simpleTaskName}:`)) {
        const paramName = key.substring(simpleTaskName.length + 1); // Remove "taskName:" prefix
        if (!(paramName in params)) {
          // Only add if not already resolved
          params[paramName] = value;
        }
      } else if (key.startsWith(`${task.taskId}:`)) {
        const paramName = key.substring(task.taskId.length + 1); // Remove "fullTaskId:" prefix
        if (!(paramName in params)) {
          // Only add if not already resolved
          params[paramName] = value;
        }
      }
    }

    return params;
  }

  private async resolveInputData(
    runId: string,
    spaceId: string,
    paramSetIndex: number,
    inputNames: string[]
  ): Promise<Record<string, string>> {
    const inputs: Record<string, string> = {};

    for (const inputName of inputNames) {
      // First try to get from database (previous task output)
      const value = await this.repository.getDataMapping(runId, spaceId, paramSetIndex, inputName);
      if (value) {
        inputs[inputName] = value;
      } else {
        const initialValue = this.getInitialInputValue(inputName, spaceId);
        if (initialValue) {
          inputs[inputName] = initialValue;
        } else {
          throw new Error(
            `No value found for input '${inputName}' in space '${spaceId}'. ` +
              `Please ensure it's defined in the experiment or space configuration.`
          );
        }
      }
    }

    return inputs;
  }

  private getInitialInputValue(inputName: string, spaceId: string): string | null {
    if (!this.artifact) {
      return null;
    }

    // First check space-level overrides
    const space = this.artifact.spaces.find(s => s.spaceId === spaceId);
    if (space && space.inputData && inputName in space.inputData) {
      return space.inputData[inputName]!;
    }

    // Then check experiment-level defaults
    if (this.artifact.inputData && inputName in this.artifact.inputData) {
      return this.artifact.inputData[inputName]!;
    }

    return null;
  }

  private async runPythonScript(
    scriptPath: string,
    params: Record<string, Expression>,
    inputData: Record<string, string>,
    task: Task
  ): Promise<Record<string, string>> {
    return new Promise(async (resolve, reject) => {
      try {
        const pythonExe = await this.getPythonExecutable();

        const args: string[] = [];

        // Add parameters
        for (const [key, value] of Object.entries(params)) {
          args.push(`--${key}`, String(value));
        }

        // Add inputs as comma-separated positional arguments in the order defined in the task
        const inputValues: string[] = [];
        for (const inputName of task.inputData) {
          const inputValue = inputData[inputName];
          if (inputValue) {
            inputValues.push(inputValue);
          }
        }

        if (inputValues.length > 0) {
          args.push(...inputValues.map(val => String(val)));
        }

        const proc = spawn(pythonExe, [scriptPath, ...args], {
          cwd: this.artifactFolder,
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
          if (code !== 0) {
            reject(new Error(`Task failed with exit code ${code}: ${stderr}`));
          } else {
            try {
              // Parse the first line of stdout to get output data strings
              const firstLine = stdout.split('\n')[0]?.trim();
              if (!firstLine) {
                reject(new Error(`No output received from Python script ${scriptPath}`));
                return;
              }

              // Parse comma-separated output strings
              const outputStrings = firstLine
                .split(',')
                .map(str => str.trim().replace(/^"|"$/g, ''));

              // Map output names to strings in the order defined in the task
              const outputs: Record<string, string> = {};
              for (let i = 0; i < task.outputData.length; i++) {
                const outputName = task.outputData[i];
                const outputString = outputStrings[i];
                if (outputName && outputString) {
                  outputs[outputName] = outputString;
                } else {
                  reject(
                    new Error(`Missing output for '${outputName}' or insufficient outputs returned`)
                  );
                  return;
                }
              }

              resolve(outputs);
            } catch (error) {
              reject(new Error(`Failed to parse script output: ${(error as Error).message}`));
            }
          }
        });
        proc.on('error', err => {
          if (err.message.includes('ENOENT')) {
            reject(
              new Error(
                `Python executable not found. Please ensure Python is installed and available in the system PATH. Original error: ${err.message}`
              )
            );
          } else {
            reject(err);
          }
        });
      } catch (error) {
        reject(new Error(`Failed to get Python executable: ${(error as Error).message}`));
      }
    });
  }

  /**
   * Determines the available Python executable (python3 or python as fallback).
   * Caches the result for subsequent calls.
   *
   * @returns Promise resolving to the Python executable name
   * @throws Error if no Python executable is found
   */
  private async getPythonExecutable(): Promise<string> {
    if (this.pythonExecutable) {
      return this.pythonExecutable;
    }

    const execAsync = promisify(exec);

    // Try python3 first
    try {
      await execAsync('python3 --version');
      this.pythonExecutable = 'python3';
      return this.pythonExecutable;
    } catch {
      // python3 not found, try python
      try {
        await execAsync('python --version');
        this.pythonExecutable = 'python';
        return this.pythonExecutable;
      } catch {
        throw new Error(
          'No Python executable found. Please ensure Python is installed and available in the system PATH (python3 or python).'
        );
      }
    }
  }
}
