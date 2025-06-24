# @extremexp/experiment-runner

Local experiment execution engine for the ExtremeXP ecosystem, providing command-line interface and database tracking for experiment runs.

## Overview

The Experiment Runner provides local execution capabilities for experiments defined in ESPACE files. It manages experiment lifecycle, tracks execution history, and provides detailed progress monitoring.

## Features

- **Local Execution**: Run experiments on the local machine
- **Database Tracking**: SQLite database for execution history and results
- **Progress Monitoring**: Real-time progress tracking with detailed logs
- **Parameter Management**: Handle parameter spaces and value generation
- **Concurrent Execution**: Support for parallel experiment runs
- **Result Aggregation**: Collect and analyze experiment outcomes

## Installation

### As a Global CLI Tool

```bash
npm install -g @extremexp/experiment-runner
```

### In a Project

```bash
npm install @extremexp/experiment-runner
```

## Usage

### Command Line Interface

```bash
# Run a single experiment
experiment-runner run experiment.espace

# Run with specific parameters
experiment-runner run experiment.espace --params "inputFile=data.csv,iterations=100"

# List execution history
experiment-runner list

# Show experiment details
experiment-runner show <experiment-id>

# Clean up old runs
experiment-runner cleanup --older-than 30d
```

### Command Options

```
Usage: experiment-runner <command> [options]

Commands:
  run <file>                Run an experiment
  list                      List experiment runs
  show <id>                 Show experiment details
  status <id>               Check experiment status
  stop <id>                 Stop running experiment
  cleanup                   Clean up old experiments

Options:
  --params <params>         Parameter overrides (key=value,key=value)
  --database <path>         Database file path (default: ./experiments.db)
  --max-concurrent <n>      Maximum concurrent runs (default: 3)
  --timeout <seconds>       Execution timeout (default: 3600)
  --verbose                 Enable verbose logging
  -h, --help               Display help information
```

### Examples

#### Basic Experiment Execution
```bash
# Run a parameter sweep experiment
experiment-runner run parameter-sweep.espace

# Output:
# Starting experiment: ParameterSweepExperiment
# Parameter space: 12 combinations
# Running 3 concurrent processes...
# [1/12] ✓ inputSize=100, algorithm=quick (2.3s)
# [2/12] ✓ inputSize=100, algorithm=merge (1.8s)
# [3/12] ⏳ inputSize=200, algorithm=quick (running...)
```

#### Parameter Override
```bash
# Override specific parameters
experiment-runner run experiment.espace --params "maxIterations=50,outputPath=/tmp/results"
```

#### Database Management
```bash
# Use custom database location
experiment-runner run experiment.espace --database /path/to/experiments.db

# List recent runs
experiment-runner list --limit 10

# Show detailed results
experiment-runner show exp-20241224-001 --verbose
```

## Programmatic Usage

```typescript
import { ExperimentRunner, ExperimentConfig } from '@extremexp/experiment-runner';

const runner = new ExperimentRunner({
  databasePath: './experiments.db',
  maxConcurrent: 2,
  timeout: 1800
});

// Run experiment
const config: ExperimentConfig = {
  file: 'experiment.espace',
  parameters: {
    inputFile: 'data.csv',
    iterations: 100
  }
};

try {
  const result = await runner.runExperiment(config);
  console.log(`Experiment completed: ${result.id}`);
  console.log(`Duration: ${result.duration}ms`);
  console.log(`Status: ${result.status}`);
} catch (error) {
  console.error('Experiment failed:', error);
}
```

### Event Monitoring

```typescript
import { ExperimentRunner } from '@extremexp/experiment-runner';

const runner = new ExperimentRunner();

// Listen for progress updates
runner.on('progress', (event) => {
  console.log(`Progress: ${event.completed}/${event.total} (${event.percentage}%)`);
});

// Listen for completion
runner.on('completed', (result) => {
  console.log(`Experiment ${result.id} completed with status: ${result.status}`);
});

// Listen for errors
runner.on('error', (error) => {
  console.error('Experiment error:', error);
});
```

## Database Schema

The experiment runner uses SQLite to track execution history:

```sql
-- Experiments table
CREATE TABLE experiments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  parameters TEXT, -- JSON
  results TEXT,    -- JSON
  error_message TEXT
);

-- Parameter combinations table
CREATE TABLE parameter_combinations (
  id TEXT PRIMARY KEY,
  experiment_id TEXT REFERENCES experiments(id),
  combination_index INTEGER,
  parameters TEXT, -- JSON
  status TEXT NOT NULL,
  started_at DATETIME,
  completed_at DATETIME,
  output_path TEXT,
  error_message TEXT
);
```

## Configuration

### Configuration File

Create `.experimentrc.json` in your project root:

```json
{
  "database": {
    "path": "./experiments.db",
    "autoCleanup": true,
    "maxAge": "30d"
  },
  "execution": {
    "maxConcurrent": 3,
    "timeout": 3600,
    "retryAttempts": 2
  },
  "logging": {
    "level": "info",
    "outputFile": "./experiment-runner.log"
  },
  "directories": {
    "output": "./experiment-outputs",
    "temp": "./temp",
    "logs": "./logs"
  }
}
```

## Architecture

```
src/
├── cli.ts                 # Command-line interface
├── managers/              # Execution management
│   ├── ExperimentManager.ts
│   ├── ParameterManager.ts
│   └── ProcessManager.ts
├── database/              # Database operations
│   ├── DatabaseManager.ts
│   ├── ExperimentStore.ts
│   └── migrations/
├── executors/             # Execution engines
│   ├── LocalExecutor.ts
│   ├── ParameterExecutor.ts
│   └── TaskExecutor.ts
├── progress/              # Progress tracking
│   ├── ProgressTracker.ts
│   └── ProgressReporter.ts
├── types/                 # Type definitions
│   ├── Experiment.ts
│   ├── ParameterSpace.ts
│   └── ExecutionResult.ts
└── userInput/             # User interaction
    ├── ParameterPrompt.ts
    └── ConfirmationPrompt.ts
```

## Execution Flow

1. **Parse ESPACE File**: Load and validate experiment definition
2. **Generate Parameter Space**: Create all parameter combinations
3. **Initialize Database**: Set up tracking records
4. **Execute Parameters**: Run parameter combinations (with concurrency control)
5. **Monitor Progress**: Track execution status and collect outputs
6. **Aggregate Results**: Combine results and update database
7. **Report Results**: Display summary and save artifacts

## Integration

### VS Code Extension
The experiment runner is integrated with the VS Code extension:
- Command palette: "ExtremeXP: Run Experiment"
- Progress panel with real-time updates
- Results viewer with execution history

### Server Integration
Works with the experiment runner server for remote execution:
- Local runner can delegate to remote server
- Shared database schema for consistency
- WebSocket updates for real-time monitoring

## Error Handling

The runner provides comprehensive error handling:

```bash
$ experiment-runner run invalid.espace

Error: Invalid ESPACE file: invalid.espace
  Parse error at line 15: Undefined workflow 'MissingWorkflow'
  
  space TestSpace {
    workflow MissingWorkflow;
             ^^^^^^^^^^^^^^^
  }

Suggestions:
  - Check workflow file exists
  - Verify workflow name spelling
  - Ensure workflow is properly defined
```

## Performance Considerations

- **Concurrent Execution**: Configurable concurrency limits to balance resource usage
- **Database Optimization**: Indexed queries for fast experiment lookup
- **Memory Management**: Streaming for large parameter spaces
- **Disk Space**: Automatic cleanup of old experiment data

## Contributing

When extending the experiment runner:

1. Add new executor classes for different execution types
2. Extend database schema with migrations
3. Update CLI commands and options
4. Add comprehensive tests for new functionality
5. Update documentation and examples

## License

MIT