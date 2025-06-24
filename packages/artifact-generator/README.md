# @extremexp/artifact-generator

Command-line tool for generating experiment artifacts from ESPACE experiment files.

## Overview

The Artifact Generator is a CLI tool that parses ESPACE experiment configurations and their associated XXP workflow definitions to generate JSON artifacts for experiment execution.

## Features

- **JSON Artifact Generation**: Creates structured experiment artifacts for execution engines
- **Parameter Resolution**: Handle parameter inheritance and overrides across workflow hierarchies
- **Validation**: Verify workflow and experiment definitions with detailed error reporting
- **Control Flow Analysis**: Validates experiment control flow and detects unreachable spaces

## Installation

### As a Global CLI Tool

```bash
npm install -g @extremexp/artifact-generator
```

### In a Project

```bash
npm install @extremexp/artifact-generator
```

## Usage

### Basic Usage

```bash
# Generate artifact from ESPACE experiment file
artifact-generator experiment.espace

# Generate with custom output location
artifact-generator experiment.espace -o /path/to/output.json

# Validate only without generating artifacts
artifact-generator experiment.espace --validate-only

# Enable verbose logging
artifact-generator experiment.espace --verbose
```

### Command Line Options

```
Usage: artifact-generator [options] <espace-file>

Arguments:
  espace-file          Path to the ESPACE experiment file

Options:
  -V, --version        output the version number
  -o, --output <path>  Output file path (default: artifact.json in same directory as input file)
  --validate-only      Only validate, do not generate artifact
  --verbose            Enable verbose logging
  -h, --help           display help for command
```

### Examples

#### Generate Experiment Artifact
```bash
# Generate JSON artifact from experiment file
artifact-generator myexperiment.espace
# Creates artifact.json in the same directory

# Generate with specific output path
artifact-generator myexperiment.espace -o /output/experiment-artifact.json
```

#### Validation Only
```bash
# Validate experiment and workflow files without generating artifacts
artifact-generator myexperiment.espace --validate-only
```

## Programmatic Usage

```typescript
import { ArtifactGenerator, ArtifactGeneratorOptions } from '@extremexp/artifact-generator';

const generator = new ArtifactGenerator({
  verbose: true
});

try {
  const { artifact, validation } = await generator.generate('experiment.espace');
  console.log('Generated artifact:', artifact);
  if (validation.warnings.length > 0) {
    console.warn('Warnings:', validation.warnings);
  }
} catch (error) {
  console.error('Generation failed:', error);
}
```

## Output Format

The generated artifact is a JSON file containing:

- **Experiment metadata**: Name and version
- **Tasks**: Resolved task definitions with parameters and implementations
- **Spaces**: Parameter space configurations and execution orders
- **Control flow**: Experiment transitions and flow control
- **Data dependencies**: Input and output data definitions

Example artifact structure:
```json
{
  "experiment": "MyExperiment",
  "version": "1.0",
  "tasks": [...],
  "spaces": [...],
  "control": {...},
  "inputData": {...}
}
```

## Architecture

```
src/
├── cli.ts                 # Command-line interface
├── generators/            # Artifact generation engines
│   ├── ArtifactGenerator.ts
│   ├── ControlFlowGenerator.ts
│   ├── SpaceGenerator.ts
│   └── TaskGenerator.ts
├── parsers/               # Input file parsers
│   ├── ExperimentParser.ts
│   ├── WorkflowParser.ts
│   └── DataFlowResolver.ts
├── resolvers/             # Parameter and dependency resolution
│   ├── ParameterResolver.ts
│   ├── TaskResolver.ts
│   ├── DataResolver.ts
│   └── FileResolver.ts
├── visitors/              # AST processing
└── models/                # Data models
    ├── ArtifactModel.ts
    ├── ExperimentModel.ts
    └── WorkflowModel.ts
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm run test
npm run test:coverage
```

### Running Development Version

```bash
npm run cli:dev -- experiment.espace --output ./test-output.json
```

## Error Handling

The generator provides detailed error reporting for common issues:

- **Syntax errors**: Parse errors in XXP or ESPACE files
- **Missing references**: Undefined workflows, tasks, or parameters  
- **Control flow issues**: Unreachable spaces, infinite loops
- **Data flow problems**: Missing inputs, circular dependencies
- **File system errors**: Missing implementation files

Example error output:
```bash
$ artifact-generator invalid.espace

Validation errors:
  - Workflow 'MissingWorkflow' referenced in space 'Space1' not found
  - Space 'UnreachableSpace' is defined but unreachable in control flow
  - Implementation file 'missing_script.py' for task 'task1' not found
```

## Integration

### VS Code Extension
The artifact generator is integrated into the VS Code extension and can be triggered via:
- Command palette: "ExtremeXP: Generate Artifact"
- Right-click context menu on ESPACE files

### Build Systems
Integrate with build tools:

```json
// package.json
{
  "scripts": {
    "build:artifacts": "artifact-generator experiment.espace -o artifacts/",
    "prebuild": "npm run build:artifacts"
  }
}
```

## Contributing

When contributing to the artifact generator:

1. Ensure new features have corresponding tests
2. Update the CLI interface if adding new options
3. Maintain backward compatibility in the output format
4. Add validation for new language features
5. Update documentation

## License

MIT