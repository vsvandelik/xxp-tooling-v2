# @extremexp/artifact-generator

A powerful CLI tool and library for generating executable experiment artifacts from ExtremeXP ESPACE experiment files.

## Overview

The artifact generator is responsible for:

- **Parsing** ESPACE experiment files and XXP workflow files
- **Validating** experiment definitions, workflow inheritance, and control flows
- **Resolving** task dependencies, parameter relationships, and data flows
- **Generating** JSON artifacts that can be executed by the experiment runner

## Architecture

The package is organized into several key modules:

### Core Components

- **ArtifactGenerator** - Main orchestrator class that coordinates the entire generation process
- **CLI** - Command-line interface for standalone usage

### Parsers

- **ExperimentParser** - Parses ESPACE experiment files using ANTLR
- **WorkflowParser** - Parses XXP workflow files using ANTLR
- **DataFlowResolver** - Validates data flow between tasks

### Resolvers

- **TaskResolver** - Resolves task definitions with inheritance and deduplication
- **ParameterResolver** - Resolves parameter spaces and combinations
- **DataResolver** - Resolves data dependencies and mappings
- **FileResolver** - Locates workflow and implementation files

### Generators

- **TaskGenerator** - Generates task definitions for the artifact
- **SpaceGenerator** - Generates parameter space definitions
- **ControlFlowGenerator** - Generates control flow definitions

### Models

- **ArtifactModel** - Final artifact structure
- **ExperimentModel** - Parsed experiment representation
- **WorkflowModel** - Parsed workflow representation

## Usage

### Command Line Interface

```bash
# Generate artifact from ESPACE file
artifact-generator experiment.espace

# Generate to specific output file
artifact-generator experiment.espace -o my-artifact.json

# Validate only (no artifact generation)
artifact-generator experiment.espace --validate-only

# Enable verbose logging
artifact-generator experiment.espace --verbose
```

### Programmatic Usage

```typescript
import { ArtifactGenerator } from '@extremexp/artifact-generator';

const generator = new ArtifactGenerator({
  verbose: true
});

// Generate artifact
const result = await generator.generate('path/to/experiment.espace');
if (result.artifact) {
  console.log('Generated artifact:', result.artifact);
}

// Validate only
const validation = await generator.validate('path/to/experiment.espace');
if (validation.errors.length > 0) {
  console.error('Validation errors:', validation.errors);
}
```

## Artifact Structure

The generated artifacts follow this structure:

```json
{
  "experiment": "ExperimentName",
  "version": "1.0",
  "tasks": [
    [
      {
        "taskId": "workflow:taskName",
        "workflow": "WorkflowName",
        "implementation": "path/to/implementation.py",
        "dynamicParameters": ["param1", "param2"],
        "staticParameters": {"param3": "value"},
        "inputData": ["input1"],
        "outputData": ["output1"]
      }
    ]
  ],
  "spaces": [
    {
      "spaceId": "spaceName",
      "tasksOrder": ["workflow:taskName"],
      "parameters": [{"param1": "value1", "param2": "value2"}],
      "inputData": {"data1": "path/to/file"}
    }
  ],
  "control": {
    "START": "spaceName",
    "transitions": [
      {"from": "spaceName", "to": "END"}
    ]
  },
  "inputData": {"globalData": "path/to/file"}
}
```

## Key Features

### Workflow Inheritance

The generator supports workflow inheritance where child workflows can:
- Inherit tasks from parent workflows
- Override task configurations (implementation, parameters, I/O)
- Add new tasks
- Inherit data definitions and task chains

### Parameter Classification

Parameters are automatically classified as:
- **Dynamic**: Parameters with enum/range values that vary across experiment runs
- **Static**: Parameters with fixed values defined in workflows

### Task Deduplication

Tasks that are identical across different workflow instances are automatically deduplicated to optimize artifact size and execution.

### Validation

Comprehensive validation includes:
- Syntax validation for ESPACE and XXP files
- Workflow inheritance cycle detection
- Control flow reachability analysis
- Task chain validation
- Data flow validation
- Implementation file existence checking

## File Conventions

- **ESPACE files**: `.espace` extension for experiment definitions
- **XXP files**: `.xxp` extension for workflow definitions
- **Implementation files**: Referenced by relative paths from workflow files

## Error Handling

The generator provides detailed error messages for:
- Syntax errors in ESPACE/XXP files
- Missing workflow or task references
- Circular inheritance or dependencies
- Invalid control flow definitions
- Missing implementation files
- Data flow inconsistencies

## Extension Points

The architecture supports extension through:
- Custom visitors for new language features
- Additional generators for different artifact formats
- Custom resolvers for specialized dependency resolution
- Pluggable validation rules

## Dependencies

- **@extremexp/core**: Core language parsing components
- **commander**: CLI argument parsing
- **ANTLR4**: Language parsing runtime

## Development

```bash
# Build the package
npm run build

# Run tests
npm run test

# Run with coverage
npm run test:coverage

# Development CLI usage
npm run cli:dev -- experiment.espace
```