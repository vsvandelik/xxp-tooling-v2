import { spawn } from 'child_process';
import { DatabaseRepository } from '../database/DatabaseRepository.js';
import { ProgressEmitter } from '../progress/ProgressEmitter.js';
import { Task, ParameterSet, Expression } from '../types/artifact.types.js';

export class TaskExecutor {
  constructor(
    private repository: DatabaseRepository,
    private progress: ProgressEmitter
  ) {}

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
          data_value: outputValue, // Stores string data in the new column
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

    for (const dynParam of task.dynamicParameters) {
      // Check for task-specific override
      const overrideKey = `${task.taskId}:${dynParam}`;
      if (overrideKey in paramSet) {
        params[dynParam] = paramSet[overrideKey]!;
      } else if (dynParam in paramSet) {
        params[dynParam] = paramSet[dynParam]!;
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
      const value = await this.repository.getDataMapping(runId, spaceId, paramSetIndex, inputName);
      if (value) {
        inputs[inputName] = value;
      } else {
        // Assume it's an initial input provided as a string
        inputs[inputName] = inputName;
      }
    }

    return inputs;
  }
  private async runPythonScript(
    scriptPath: string,
    params: Record<string, Expression>,
    inputData: Record<string, string>,
    task: Task
  ): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
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
        args.push(inputValues.join(','));
      }

      const proc = spawn('python', [scriptPath, ...args]);

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
              reject(new Error('No output received from Python script'));
              return;
            }

            // Parse comma-separated output strings
            const outputStrings = firstLine.split(',').map(str => str.trim().replace(/^"|"$/g, ''));

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
        reject(err);
      });
    });
  }
}
