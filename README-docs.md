# XXP Tooling v2 - ExtremeXP Documentation

A comprehensive TypeScript monorepo providing complete tooling support for the ExtremeXP experimental programming system, supporting XXP (workflow) and ESPACE (experiment space) languages.

## Architecture Overview

XXP Tooling v2 implements a complete toolchain for ExtremeXP experimental programming through a multi-stage model transformation pipeline:

1. **Parsing**: ANTLR converts XXP and ESPACE text to Abstract Syntax Trees (AST)
2. **Model Building**: AST transforms to domain models (ExperimentModel, WorkflowModel)
3. **Resolution**: Resolves inheritance, parameters, and data flow dependencies
4. **Generation**: Creates executable artifact JSON for experiment execution

## Package Relationships

### Core Infrastructure
- **@extremexp/core**: Foundation package providing ANTLR-based parsing for XXP and ESPACE languages, shared type definitions, and language-specific analysis capabilities

### Language Services
- **@extremexp/language-server**: Language Server Protocol implementation providing IDE features like syntax highlighting, auto-completion, error checking, and cross-reference navigation

### Artifact Processing
- **@extremexp/artifact-generator**: CLI tool and programmatic API for transforming ESPACE experiment definitions into executable JSON artifacts

### Workflow Management
- **@extremexp/workflow-repository**: API for workflow storage, retrieval, and management with support for local and remote repositories

## Key Features

### Language Support
- **XXP Language**: Workflow definition language supporting parameter definitions, task orchestration, conditional execution, and script integration
- **ESPACE Language**: Experiment space definition language supporting parameter space definitions, experiment configurations, and workflow references

### Development Tools
- Full ANTLR4-based parsing with error recovery
- Symbol table construction and cross-reference resolution
- IDE features through Language Server Protocol
- CLI tools for artifact generation and validation

### Runtime Environment
- Experiment artifact execution engine
- Progress tracking and real-time updates
- Web-based experiment monitoring

## External Resources

- [GitHub Repository](https://github.com/vsvandelik/xxp-tooling-v2)
- [Project README](https://github.com/vsvandelik/xxp-tooling-v2/blob/main/README.md)