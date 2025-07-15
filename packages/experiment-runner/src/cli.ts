/**
 * Command-line interface for the ExtremeXP experiment runner.
 * Provides CLI commands for running, monitoring, and controlling experiments.
 */

import chalk from 'chalk';
import { Command } from 'commander';
import ora, { Ora } from 'ora';
import prompts from 'prompts';

import { ExperimentExecutor } from './executors/ExperimentExecutor.js';
import { Expression } from './types/artifact.types.js';
import { ProgressCallback } from './types/progress.types.js';
import { UserInputProvider } from './userInput/UserInputProvider.js';

/**
 * CLI-specific user input provider that uses prompts for interactive input.
 */
class CLIInputProvider implements UserInputProvider {
  /**
   * Prompts the user for input using the command line interface.
   *
   * @param prompt - The prompt message to display to the user
   * @returns Promise resolving to the user's input
   */
  async getInput(prompt: string): Promise<string> {
    const response = await prompts({
      type: 'text',
      name: 'value',
      message: prompt,
    });
    return response.value;
  }
}

/**
 * CLI-specific progress callback that provides colorized terminal output with spinners.
 */
class CLIProgressCallback implements ProgressCallback {
  private spinner: Ora | undefined;

  /**
   * Called when a task starts execution.
   *
   * @param taskId - Unique identifier of the task
   * @param params - Parameter values for this task execution
   */
  onTaskStart(taskId: string, params: Record<string, Expression>): void {
    this.spinner = ora(`Running task ${chalk.blue(taskId)}`).start();
    console.log(chalk.gray(`  Parameters: ${JSON.stringify(params)}`));
  }

  /**
   * Called when a task completes successfully.
   *
   * @param taskId - Unique identifier of the task
   * @param _params - Parameter values used (unused in CLI)
   * @param outputs - Output data produced by the task
   */
  onTaskComplete(
    taskId: string,
    _params: Record<string, Expression>,
    outputs: Record<string, string>
  ): void {
    this.spinner?.succeed(
      `Task ${chalk.blue(taskId)} completed  ${chalk.gray(`Outputs: ${Object.keys(outputs).join(', ')}`)}`
    );
  }

  /**
   * Called when a parameter space starts execution.
   *
   * @param spaceId - Unique identifier of the space
   */
  onSpaceStart(spaceId: string): void {
    console.log(chalk.yellow(`\nStarting space: ${spaceId}`));
  }

  /**
   * Called when a parameter space completes execution.
   *
   * @param spaceId - Unique identifier of the space
   */
  onSpaceComplete(spaceId: string): void {
    console.log(chalk.green(`✓ Space ${spaceId} completed\n`));
  }

  /**
   * Called when a parameter set starts execution within a space.
   *
   * @param _spaceId - Space identifier (unused in CLI)
   * @param index - Index of the parameter set (0-based)
   * @param params - Parameter values for this set
   */
  onParameterSetStart(_spaceId: string, index: number, params: Record<string, Expression>): void {
    console.log(chalk.cyan(`  Parameter set ${index + 1}: ${JSON.stringify(params)}`));
  }

  /**
   * Called when a parameter set completes execution.
   *
   * @param _spaceId - Space identifier (unused)
   * @param _index - Parameter set index (unused)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onParameterSetComplete(_spaceId: string, _index: number): void {
    //console.log(chalk.gray(`    ✓ Parameter set ${index + 1} completed`));
  }

  /**
   * Called when user input is required during experiment execution.
   *
   * @param prompt - The prompt message requesting user input
   */
  onUserInputRequired(prompt: string): void {
    this.spinner?.stop();
    console.log(chalk.magenta(`\nUser input required: ${prompt}`));
  }

  /**
   * Called when an error occurs during experiment execution.
   *
   * @param error - The error that occurred
   * @param context - Additional context information about the error
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError(error: Error, context: any): void {
    this.spinner?.fail(`Error: ${error.message}`);
    console.error(chalk.red(`Context: ${JSON.stringify(context)}`));
  }

  /**
   * Called to report overall experiment progress.
   *
   * @param progress - Progress value between 0 and 1
   * @param message - Progress message
   */
  onProgress(progress: number, message: string): void {
    console.log(chalk.blue(`[${Math.round(progress * 100)}%] ${message}`));
  }
}

const program = new Command();

program.name('experiment-runner').description('CLI for running experiments').version('1.0.0');

program
  .command('run <artifact>')
  .description('Run an experiment from an artifact file')
  .option('-r, --resume', 'Resume interrupted experiment', false)
  .option('-d, --db <path>', 'Database path', './experiment_runs.db')
  .action(async (artifactPath: string, options) => {
    const runner = new ExperimentExecutor(options.db);
    const progressCallback = new CLIProgressCallback();
    const inputProvider = new CLIInputProvider();

    try {
      console.log(chalk.bold(`Starting experiment from ${artifactPath}\n`));

      const result = await runner.run(artifactPath, {
        resume: options.resume,
        progressCallback,
        userInputProvider: inputProvider,
      });

      console.log(chalk.bold.green('\n✓ Experiment completed successfully!'));
      console.log(chalk.white('Summary:'));
      console.log(`  - Run ID: ${result.runId}`);
      console.log(`  - Completed spaces: ${result.completedSpaces.join(', ')}`);
      console.log(`  - Total tasks: ${result.summary.totalTasks}`);
      console.log(`  - Completed tasks: ${result.summary.completedTasks}`);
      console.log(`  - Failed tasks: ${result.summary.failedTasks}`);
      console.log(`  - Skipped tasks: ${result.summary.skippedTasks}`);

      if (Object.keys(result.outputs).length > 0) {
        console.log('\nOutputs:');
        for (const [spaceId, spaceOutputs] of Object.entries(result.outputs)) {
          console.log(`  ${chalk.cyan(spaceId)}:`);
          for (const [key, value] of Object.entries(spaceOutputs)) {
            console.log(`    - ${key}: ${value}`);
          }
        }
      }
    } catch (error) {
      console.error(chalk.bold.red('\n✗ Experiment failed!'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

program
  .command('status <experiment> <version>')
  .description('Check status of an experiment')
  .option('-d, --db <path>', 'Database path', './experiment_runs.db')
  .action(async (experimentName: string, version: string, options) => {
    const runner = new ExperimentExecutor(options.db);

    try {
      const status = await runner.getStatus(experimentName, version);

      if (!status) {
        console.log(chalk.yellow(`No run found for ${experimentName} v${version}`));
        return;
      }

      console.log(
        chalk.bold(`\nExperiment: ${status.experimentName} v${status.experimentVersion}`)
      );
      console.log(`Run ID: ${status.runId}`);
      console.log(
        `Status: ${chalk[status.status === 'completed' ? 'green' : status.status === 'failed' ? 'red' : 'yellow'](status.status)}`
      );

      if (status.currentSpace) {
        console.log(`Current space: ${status.currentSpace}`);
      }

      console.log('\nProgress:');
      console.log(`  Spaces: ${status.progress.completedSpaces}/${status.progress.totalSpaces}`);
      console.log(
        `  Parameter sets: ${status.progress.completedParameterSets}/${status.progress.totalParameterSets}`
      );
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('terminate <experiment> <version>')
  .description('Terminate a running experiment')
  .option('-d, --db <path>', 'Database path', './experiment_runs.db')
  .action(async (experimentName: string, version: string, options) => {
    const runner = new ExperimentExecutor(options.db);

    try {
      const terminated = await runner.terminate(experimentName, version);

      if (terminated) {
        console.log(chalk.green(`✓ Experiment ${experimentName} v${version} terminated`));
      } else {
        console.log(chalk.yellow(`No running experiment found for ${experimentName} v${version}`));
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program.parse();
