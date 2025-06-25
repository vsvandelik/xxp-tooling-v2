# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Building and Development
```bash
# Build all packages (run from root)
npm run build

# Build all packages in watch mode
npm run build:watch

# Clean all build outputs
npm run clean

# Build specific package
cd packages/core && npm run build
cd packages/artifact-generator && npm run build
```

### Testing
```bash
# Run all tests across packages
npm test

# Run tests for specific packages
cd packages/core && npm test
cd packages/artifact-generator && npm test
cd packages/language-server && npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Code Quality
```bash
# Lint all packages
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Run TypeScript type checking
npm run type-check
```

### ANTLR Grammar Development
```bash
# Regenerate ANTLR parsers (from core package)
cd packages/core && npm run antlr
```

### CLI Tools
```bash
# Generate artifacts from XXP/ESPACE files
cd packages/artifact-generator
npm run cli -- --input workflow.xxp --output ./generated

# Run experiments locally
cd packages/experiment-runner
npm run cli -- run-experiment experiment.espace

# Start experiment runner server
cd packages/experiment-runner-server && npm run start

# Start workflow repository server
cd packages/workflow-repository-server && npm run start
```

## Architecture Overview

XXP Tooling v2 is a TypeScript monorepo implementing a complete toolchain for ExtremeXP experimental programming, supporting XXP (workflow) and ESPACE (experiment space) languages.

### Core Processing Pipeline
```
Raw Text → ANTLR AST → Domain Models → Resolved Models → Artifact JSON → Execution
```

### Package Dependencies
- **@extremexp/core**: Base ANTLR parsers, shared utilities
- **@extremexp/artifact-generator**: Depends on core; generates execution artifacts
- **@extremexp/language-server**: Depends on core; provides LSP features
- **@extremexp/experiment-runner**: Executes generated artifacts locally
- **@extremexp/experiment-runner-server**: Web API for remote execution
- **@extremexp/workflow-repository**: Manages workflow sharing
- **@extremexp/vs-code-extension**: Integrates all tools for VS Code

### Key Architectural Patterns

#### Multi-Stage Model Transformation
The system transforms code through several stages:
1. **Parsing**: ANTLR converts text to AST
2. **Model Building**: AST to domain models (ExperimentModel, WorkflowModel)
3. **Resolution**: Resolves inheritance, parameters, data flow
4. **Generation**: Creates executable artifact JSON

#### Symbol Table Architecture
Language server uses hierarchical symbol tables:
- **WorkflowSymbol**: Handles workflow inheritance chains
- **ExperimentSymbol**: Manages experiment-level scoping
- **Document Dependencies**: Tracks inter-file relationships

#### Visitor Pattern Implementation
Multiple visitor types serve different purposes:
- **Model Visitors**: AST to domain model conversion
- **Symbol Table Builders**: Build language server symbols
- **Validation Visitors**: Semantic analysis and error checking

### Language Features

#### XXP Language (Workflows)
- **Task Chains**: `START -> task1 -> task2 -> END`
- **Inheritance**: `from BaseWorkflow` for workflow extension
- **Parameter Configuration**: Override parameters in task configurations
- **Implementation Files**: Reference external task implementations

#### ESPACE Language (Experiment Spaces)
- **Parameter Spaces**: `param x = enum(1,2,3)` or `param y = range(0,10,1)`
- **Control Flow**: Simple (`->`) and conditional (`-?>`) transitions
- **Space Configuration**: Configure workflows for different parameter combinations
- **Strategies**: `CARTESIAN_PRODUCT`, `RANDOM_SEARCH` for execution planning

### Important File Locations

#### Core Language Infrastructure
- `packages/core/src/language/grammar/`: ANTLR grammar files (XXP.g4, ESPACE.g4)
- `packages/core/src/language/generated/`: Generated ANTLR parsers
- `packages/core/src/utils/`: Shared utilities (naming conventions)

#### Artifact Generation
- `packages/artifact-generator/src/parsers/`: File parsing logic
- `packages/artifact-generator/src/resolvers/`: Dependency resolution
- `packages/artifact-generator/src/generators/`: Output generation
- `packages/artifact-generator/src/models/`: Domain models

#### Language Server
- `packages/language-server/src/core/models/`: Symbol and document models
- `packages/language-server/src/language/symbolTable/`: Symbol table builders
- `packages/language-server/src/providers/`: LSP feature providers

### Development Workflow Patterns

#### When Working with Grammar Changes
1. Modify grammar files in `packages/core/src/language/grammar/`
2. Run `cd packages/core && npm run antlr` to regenerate parsers
3. Run `npm run clean && npm run build` from root to rebuild all packages
4. Update corresponding visitors/models if AST structure changed

#### When Adding New Language Features
1. Update ANTLR grammar first
2. Regenerate parsers
3. Update model visitors in artifact-generator
4. Update symbol table builders in language-server
5. Add corresponding tests in relevant packages

#### When Working with Cross-Package Dependencies
- Use workspace-relative imports: `@extremexp/core`, `@extremexp/artifact-generator`
- Build packages in dependency order: core → artifact-generator → language-server
- Run `npm run build` from root to handle all dependencies

### Testing Infrastructure

#### Test Organization
- Each package uses `__tests__/` directories with `.test.ts` files
- Jest with TypeScript/ESM support across all packages
- Comprehensive integration tests in artifact-generator
- Language server has extensive test cases for LSP features

#### Test Data Patterns
- Integration test cases in `.test` files under `__tests__/integration-test-cases/`
- Completion test cases under `__tests__/completion-test-cases/`
- Test files use XXP/ESPACE syntax for realistic testing

### Troubleshooting Common Issues

#### ANTLR/TypeScript Compilation Conflicts
If encountering parser type conflicts:
1. `npm run clean` to remove all build outputs
2. `cd packages/core && npm run antlr` to regenerate parsers
3. `npm run build` to rebuild everything
4. `npm test` to verify functionality

#### Workspace Dependency Issues
- Ensure all internal dependencies use exact workspace versions
- Run `npm install` from root after changing package.json files
- Use `npm run build` to ensure proper compilation order