---
title: Executing Experiments
group: Documentation
category: User Guide
parent: static/user_documentation.md
---

# Executing Experiments

The ExtremeXP framework provides a comprehensive system for executing data-driven experiments. This process is structured into two main stages: **artifact generation** and **experiment execution**. This two-stage approach ensures robust validation of experiment definitions and provides powerful execution capabilities with built-in monitoring and recovery features.

## Execution Overview

### Two-Stage Process

1.  **Artifact Generation**: Transforms human-readable XXP and ESPACE files into machine-executable JSON artifacts.
2.  **Experiment Execution**: Runs experiments by interpreting the generated JSON artifacts using the ExtremeXP experiment runner.

### Key Benefits

  * **Validation**: Comprehensive syntax and semantic checking occurs during artifact generation, ensuring definitions are correct before execution begins.
  * **Reproducibility**: Experiments run consistently from identical, immutable artifacts, facilitating exact replication of results.
  * **Portability**: Generated JSON artifacts are self-contained and can be executed on different systems with the ExtremeXP runner, promoting flexible deployment.
  * **Monitoring**: Real-time progress tracking provides visibility into ongoing experiment execution.
  * **Recovery**: The system supports re-running interrupted or failed experiments.

## Artifact Generation

### Purpose and Functionality

Artifact generation is the crucial first step where your experiment definitions written in XXP and ESPACE are compiled into a highly structured, machine-executable JSON format. This process ensures the integrity and correctness of your experiment before it runs.

During artifact generation, the system performs:

  * **Syntax Validation**: Verifies the grammatical correctness of your XXP and ESPACE code.
  * **Semantic Analysis**: Checks the logical consistency of your workflow. This includes validating that all referenced tasks, data variables, and parameters exist and are used correctly, and that dependencies are sound.
  * **Parameter Resolution**: Resolves all parameter values, including those from `range` and `enum` functions in ESPACE, and applies precedence rules for overrides.
  * **Dependency Analysis**: Constructs and validates the task execution graph, ensuring all dependencies are met and no circular dependencies exist.

### Commands for Artifact Generation

#### ExtremeXP: Generate Artifact (`extremexp.generateArtifact`)

This is the primary command for initiating the artifact generation process.

  * **Access Methods**:

      * **Command Palette**: Open the Command Palette (`Ctrl+Shift-P` / `Cmd+Shift-P`) and search for "ExtremeXP: Generate Artifact".

  * **Functionality**:

      * Prompts you to select the primary ESPACE file for your experiment.
      * Automatically discovers and processes all imported workflows and spaces.
      * Performs comprehensive syntax and semantic validation across all involved files.
      * Generates a single, self-contained JSON artifact representing the complete experiment specification.
      * Provides detailed error and warning messages in the VS Code Problems panel and Output channel if any issues are detected.

#### Generation Process

1.  **File Selection**: You select the main `.espace` file that defines your experiment.
2.  **Dependency Resolution**: The artifact generator automatically identifies and loads all workflows and spaces referenced by your primary file via import statements.
3.  **Validation**: A thorough check of syntax, semantics, and inter-file dependencies is performed.
4.  **Artifact Creation**: If validation is successful, a JSON artifact is created, containing the complete, flattened experiment specification.
5.  **Output**: The generated artifact is saved to the specified location, and a status report is provided.

### Artifact Structure

#### Generated JSON Format

The output of the artifact generation process is a JSON file that encapsulates the entire experiment. This artifact contains:

  * **Workflow Definitions**: Complete, flattened specifications of all tasks, their `implementation` details, `input` and `output` data, and default `param` configurations.
  * **Parameter Spaces**: All parameter variations defined in ESPACE, including resolved `range` and `enum` values, ready for exploration.
  * **Execution Metadata**: Version information of the ExtremeXP tools used and timestamps of when the artifact was generated.
  * **Dependency Graphs**: A precise representation of task execution order and data flow, derived from `taskChain` and `input/output` declarations.

## Experiment Execution

### Experiment Runner Overview

The ExtremeXP experiment runner is the core component responsible for orchestrating the complete lifecycle of an experiment using the generated JSON artifacts. It translates the abstract experiment definition into concrete computational actions.

#### Core Capabilities

  * **Multi-level Execution**: Manages complex experimental hierarchies defined in ESPACE, executing stages, spaces, and tasks in the correct order.
  * **External Tool Integration**: Seamlessly launches and manages external Python scripts.
  * **Data Management**: Handles the precise flow of input and output data between tasks, ensuring data dependencies are met.
  * **Progress Monitoring**: Provides real-time status tracking and reporting on experiment progress.

### Execution Commands

#### ExtremeXP: Run Experiment (`extremexp.runExperiment`)

This is the primary command for initiating the execution of a generated experiment artifact.

  * **Access Methods**:

      * **Command Palette**: Open the Command Palette (`Ctrl+Shift-P` / `Cmd+Shift-P`) and search for "ExtremeXP: Run Experiment".

  * **Functionality**:

      * Prompts you to select a previously generated JSON experiment artifact.
      * Loads and validates the artifact to ensure its integrity.
      * Configures the execution environment based on the experiment's requirements.
      * Launches the experiment runner, passing the specified parameters.
      * Provides real-time execution monitoring feedback within VS Code.
      * Manages the entire experiment lifecycle from start to finish.

  * **Execution Options (via UI/Prompts)**:

      * **Resume Mode**: Option to re-run a previously interrupted or failed experiment.
      * **Logging Level**: Configure the detail level for execution logs.

#### ExtremeXP: Show Progress (`extremexp.showProgress`)

This command opens a dedicated interface to display the real-time progress of an executing experiment.

  * **Access Methods**:

      * **Command Palette**: Open the Command Palette (`Ctrl+Shift-P` / `Cmd+Shift-P`) and search for "ExtremeXP: Show Progress".
      * **Status Bar Button**: Click the "ExtremeXP" button located in the bottom-right corner of the VS Code status bar while an experiment is running.

  * **Features**:

      * **Real-time Updates**: Provides live progress tracking as tasks complete and experiments advance.
      * **Task Status**: Displays the individual completion status of each task within the experiment.
      * **Web Interface**: Opens a dedicated browser-based progress monitoring dashboard for a more comprehensive view.

> **Note**: A screenshot of the progress monitoring interface (`image_02419e.jpg`) would go here. It typically shows:
>
>   * Overall experiment progress percentage.
>   * Number of experiments and tasks.
>   * A list of individual experiments with their ID, workflow name, current status (e.g., `Running`, `Completed`, `Failed`), and duration.
>   * When an experiment is selected, a list of its tasks with their ID, name, status, and duration.

#### Server Management Commands

These commands allow for manual control of the experiment runner server. Remember, the server can be configured to auto-start via the `extremexp.server.autoStart` setting (see [Installation \> Configuration](https://www.google.com/search?q=installation.md%23server-configuration)).

  * ##### ExtremeXP: Stop Server (`extremexp.stopServer`)

      * **Purpose**: Shuts down the experiment runner server process.
      * **When to use**: To gracefully end all running experiments and free up system resources, or if you prefer to manually manage the server.

  * ##### ExtremeXP: Restart Server (`extremexp.restartServer`)

      * **Purpose**: Stops and then immediately restarts the experiment runner server process.
      * **When to use**: After making manual configuration changes that require a server reload, or if the server is experiencing issues.

### Execution Process

#### Experiment Lifecycle

1.  **Artifact Loading**: The generated JSON experiment artifact is loaded and validated by the runner.
2.  **Environment Setup**: The necessary execution environment is configured.
3.  **Task Scheduling**: The runner plans the optimal execution order for all tasks based on their defined dependencies.
4.  **Execution Launch**: The experiment execution begins, with continuous monitoring initiated.
5.  **Progress Tracking**: The runner tracks the completion status of tasks and overall experiment progress, reporting updates to the monitoring interface.
6.  **Result Collection**: Outputs, intermediate results, and logs from individual tasks are collected.
7.  **Completion Handling**: Upon completion or termination, final results are processed, and necessary cleanup operations are performed.

#### Task Execution

Individual tasks within an experiment are executed by launching external tools or scripts.

  * ##### External Tool Integration

      * **Python Scripts**: Execute Python-based tasks, handling standard input/output and parameter passing.

  * ##### Parameter Passing

      * The experiment runner intelligently passes parameters to tasks, typically through command-line arguments or environment variables.
      * Input data defined in XXP and ESPACE is provided to tasks as specified.

  * ##### Output Collection

      * Standard output and error streams from executed tools are captured.
      * Files generated by tasks (e.g., results, models) are collected and managed as defined by the `output` declarations.
      * Detailed execution logs are generated for debugging and monitoring purposes.

### Execution Monitoring

#### Progress Tracking Interface

The web-based progress dashboard (accessed via `ExtremeXP: Show Progress`) provides a rich, interactive view of your experiment's execution.

  * **Real-time Visualization**: Live updates of overall progress.
  * **Task Status Grid**: A visual grid or list shows the state of each individual task (e.g., pending, running, completed, failed) and its duration.
  * **Log Streaming**: Real-time log output from tasks is streamed, often with filtering capabilities to help in debugging.
  * **Interactive Controls**: Depending on the runner's capabilities, you may have controls to pause, resume, or terminate an experiment.

> **Note**: Screenshots of the progress dashboard with various views (e.g., task grid) would go here.

### Resume and Recovery

The ExtremeXP framework is designed to handle interruptions, offering features to resume failed experiments.

#### Resume Capability

  * **When to Use Resume**:
      * To re-run an experiment that was previously terminated due to a system interruption or failed task.
  * **Resume Process**:
      * When you choose to resume a failed experiment, the runner re-initializes and restarts the execution of that specific experiment run from its beginning.

#### Error Handling

  * **Manual Intervention**: For errors that halt an experiment, the system provides detailed error messages and diagnostics in the logs. This allows you to inspect the failure, fix the underlying issue (e.g., correct a script, adjust parameters), and then re-run the experiment using the resume capability.

### Advanced Execution Features

#### Conditional Execution

  * **ESPACE Integration**: The `control` block in ESPACE allows for sophisticated conditional execution (`-?>` operator) where experiment progression can depend on the outcome of previous stages or tasks. This enables dynamic adaptation, such as early stopping or result-based branching, based on user input

## Troubleshooting Execution

### Common Issues

#### Artifact Generation Problems

  * ##### Validation Errors

      * **Symptoms**: Error messages appear during artifact generation, often displayed in the VS Code Problems panel.
      * **Solutions**: Carefully review the error messages for specific syntax, semantic, or dependency issues. Use the "Validation-Only Mode" for rapid checks. Ensure all imported workflows and data are correctly defined and accessible.

  * ##### Missing Dependencies

      * **Symptoms**: Artifact generation fails because the system cannot resolve references to workflows, tasks, or data defined in other files.
      * **Solutions**: Verify the correctness of `from` statements and import paths. Ensure all referenced `.xxp` and `.espace` files exist and are accessible within your project structure. Confirm that filenames follow the `camelCase` convention corresponding to `CapitalizedCase` workflow/experiment names.

#### Execution Problems

  * ##### Server Connection Issues

      * **Symptoms**: You cannot connect to the experiment runner server, or commands related to execution fail with connection errors.
      * **Solutions**: Check the server status (via `ExtremeXP: Show Progress` if running, or by attempting to restart it). Verify the `extremexp.server.port` setting (see [Installation \> Configuration](https://www.google.com/search?q=installation.md%23server-configuration)) and ensure that port is not blocked by a firewall or used by another application. Review the "ExtremeXP Experiment Runner Server" output channel in VS Code for startup errors.

  * ##### Task Execution Failures

      * **Symptoms**: Individual tasks within an experiment fail during execution.
      * **Solutions**: Review the error logs and output for the specific failed task. Verify the availability and correct configuration of any external tools or scripts used by the task. Check that input data is correct and parameters are passed as expected.

### Getting Execution Help

If you encounter persistent issues, gather the following diagnostic information:

  * **Execution Logs**: Access detailed logs from the "ExtremeXP Experiment Runner Server" output channel in VS Code.
  * **Progress Monitoring**: Note any status messages or errors displayed in the progress monitoring interface.

When reporting issues, provide this diagnostic information along with your VS Code version, operating system details, and the ExtremeXP extension version to the project's support channels or issue tracker.

## Next Steps

After successfully executing your first experiments, delve deeper into ExtremeXP's capabilities:

1.  **Share Results**: Learn how to use [Workflow Repositories](https://www.google.com/search?q=workflow-repository-server.md) for sharing, versioning, and collaborating on experiment definitions.
2.  **Advanced Patterns**: Explore more complex experimental designs and techniques.

> **Note**: Links to example experiments and step-by-step execution tutorials would be beneficial here.