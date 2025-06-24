# XXP Tooling v2 - ExtremeXP

A comprehensive TypeScript monorepo providing complete tooling support for the ExtremeXP experiment system, including language support for XXP and ESPACE programming languages.

## Overview

The XXP Tooling project provides a complete ecosystem for experimental programming with the ExtremeXP methodology. It includes language parsing, artifact generation, experiment execution, workflow management, and a full-featured VS Code extension with language server integration.

## Packages

This monorepo contains 8 interconnected packages:

### Core Language Support
- **[@extremexp/core](./packages/core)** - Core language parsing, ANTLR grammars, and shared utilities for XXP and ESPACE languages
- **[@extremexp/language-server](./packages/language-server)** - Language Server Protocol implementation providing intelligent editing features

### Development Tools
- **[@extremexp/artifact-generator](./packages/artifact-generator)** - CLI tool for generating artifacts from XXP/ESPACE source files
- **[@extremexp/vs-code-extension](./packages/vs-code-extension)** - VS Code extension with syntax highlighting, language features, and integrated tooling

### Experiment Execution
- **[@extremexp/experiment-runner](./packages/experiment-runner)** - Local experiment execution engine with database tracking
- **[@extremexp/experiment-runner-server](./packages/experiment-runner-server)** - Express server for remote experiment execution with WebSocket support

### Workflow Management
- **[@extremexp/workflow-repository](./packages/workflow-repository)** - Client library for managing and sharing workflows
- **[@extremexp/workflow-repository-server](./packages/workflow-repository-server)** - Server for hosting workflow repositories with authentication

## Architecture

The project follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension                       │
│              (User Interface & Integration)                │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Language       │  Experiment     │  Workflow               │
│  Server         │  Runner         │  Repository             │
│  (LSP Features) │  (Execution)    │  (Management)           │
├─────────────────┴─────────────────┴─────────────────────────┤
│              Artifact Generator                            │
│             (Code Generation)                              │
├─────────────────────────────────────────────────────────────┤
│                    Core Package                            │
│         (Language Parsing, ANTLR Grammars, Utilities)      │
└─────────────────────────────────────────────────────────────┘
```

### Package Dependencies
- **Core** → Base layer with ANTLR parsers for XXP/ESPACE languages
- **Artifact Generator** → Depends on Core for parsing and generates output files
- **Language Server** → Depends on Core for AST analysis and provides LSP features
- **Experiment Runner** → Depends on Core for experiment definitions and execution
- **Servers** → Depend on their respective client packages for business logic
- **VS Code Extension** → Integrates all packages and provides unified user experience

### Languages Supported
- **XXP** - Workflow definition language with parameter inheritance and task orchestration
- **ESPACE** - Experiment space definition language for parameter exploration and execution planning

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vsvandelik/xxp-tooling-v2.git
cd xxp-tooling-v2
```

2. Install dependencies:
```bash
npm install
```

3. Build all packages:
```bash
npm run build
```

### Basic Usage

#### Using the Artifact Generator
```bash
# Generate artifacts from XXP/ESPACE files
cd packages/artifact-generator
npm run cli -- --input myworkflow.xxp --output ./generated
```

#### Using the VS Code Extension
1. Open the project in VS Code
2. Install the extension from `packages/vs-code-extension`
3. Open `.xxp` or `.espace` files to see syntax highlighting and language features

#### Running Experiments
```bash
# Start the experiment runner server
cd packages/experiment-runner-server
npm run start

# Or use the CLI for local execution
cd packages/experiment-runner
npm run cli -- run-experiment experiment.espace
```

## Project Structure

```
xxp-tooling-v2/
├── packages/
│   ├── core/                           # Language parsing & utilities
│   │   ├── src/
│   │   │   ├── language/               # ANTLR grammars and parsers
│   │   │   │   ├── generated/          # Generated ANTLR files
│   │   │   │   └── grammar/            # XXP.g4, ESPACE.g4
│   │   │   └── utils/                  # Shared utilities
│   │   └── package.json
│   ├── artifact-generator/             # Code generation tool
│   │   ├── src/
│   │   │   ├── generators/             # Output generators
│   │   │   ├── parsers/                # File parsers
│   │   │   └── cli.ts                  # CLI interface
│   │   └── package.json
│   ├── language-server/                # LSP implementation
│   │   ├── src/
│   │   │   ├── features/               # LSP feature providers
│   │   │   ├── analysis/               # Symbol analysis
│   │   │   └── server.ts               # Main server
│   │   └── package.json
│   ├── experiment-runner/              # Local execution
│   │   ├── src/
│   │   │   ├── executors/              # Execution engines
│   │   │   ├── database/               # SQLite management
│   │   │   └── cli.ts                  # CLI interface
│   │   └── package.json
│   ├── experiment-runner-server/       # Remote execution server
│   │   ├── src/
│   │   │   ├── services/               # Business logic
│   │   │   ├── routes/                 # API endpoints
│   │   │   └── server.ts               # Express server
│   │   └── package.json
│   ├── workflow-repository/            # Workflow management
│   │   ├── src/
│   │   │   ├── repositories/           # Repository implementations
│   │   │   └── types/                  # Type definitions
│   │   └── package.json
│   ├── workflow-repository-server/     # Workflow hosting server
│   │   ├── src/
│   │   │   ├── services/               # Storage & auth services
│   │   │   ├── routes/                 # API routes
│   │   │   └── server.ts               # Express server
│   │   └── package.json
│   └── vs-code-extension/              # VS Code integration
│       ├── src/
│       │   ├── commands/               # Extension commands
│       │   ├── services/               # Tool integration
│       │   ├── language-configuration/ # Language configs
│       │   └── extension.ts            # Main extension
│       └── package.json
├── package.json                        # Root workspace config
├── tsconfig.json                       # TypeScript configuration
├── TESTING.md                          # Testing documentation
└── README.md                           # This file
```

### Testing

The project uses Jest with TypeScript and ESM support for comprehensive testing across all packages.

#### Test Structure

- Each package has its own `__tests__/` directory following modern conventions
- Individual Jest configurations optimized for TypeScript/ESM
- Coverage reports generated per package with HTML and LCOV formats

#### Running Tests

```bash
# Run all tests across packages
npm test

# Run tests for a specific package
cd packages/core && npm test
cd packages/artifact-generator && npm test  
cd packages/vs-code-extension && npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

#### Current Test Coverage

- **Core package**: 100% coverage on utility functions (naming.ts)
- **Artifact generator**: Constructor and validation testing
- **VS Code extension**: Basic module import testing

See [TESTING.md](./TESTING.md) for detailed testing documentation and best practices.

### Development

#### Available Scripts

- `npm run build` - Build all packages
- `npm run build:watch` - Build all packages in watch mode
- `npm run clean` - Clean all build outputs
- `npm run test` - Run tests for all packages
- `npm run lint` - Lint all packages
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

#### Package-Specific Development

Each package can be developed independently:

```bash
# Work on a specific package
cd packages/core
npm run build:watch        # Build in watch mode
npm run test:watch         # Run tests in watch mode

# Or from root for all packages
npm run build:watch        # Build all packages in watch mode
npm test                   # Run all tests
```

#### TypeScript Configuration

The project uses a modern TypeScript setup with:

- **Strict mode**: All strict type checking options enabled
- **Modern target**: ES2022 with ESNext modules
- **Project references**: For fast incremental builds across packages
- **Composite builds**: Optimized for monorepo structure

#### Adding Dependencies

For workspace dependencies (internal packages):
```bash
# Dependencies are managed via package.json workspaces
# Example: @extremexp/artifact-generator depends on @extremexp/core
```

For external dependencies:
```bash
# Add to root (affects all packages as dev dependency)
npm install --save-dev <package-name>

# Add to specific package
npm install <package-name> --workspace=@extremexp/core
```

## Troubleshooting

### TypeScript Compilation Errors with Generated Files

If you encounter TypeScript compilation errors related to ANTLR generated files (like `ESPACEParser` or `XXPParser` type conflicts), this is usually due to stale build artifacts. Follow these steps:

1. **Clean all build outputs**:
   ```bash
   npm run clean
   ```

2. **Regenerate ANTLR parser files** (if needed):
   ```bash
   cd packages/core
   npm run antlr
   ```

3. **Rebuild everything**:
   ```bash
   npm run build
   ```

4. **Run tests to verify**:
   ```bash
   npm test
   ```

This resolves type conflicts between source TypeScript files and compiled JavaScript artifacts in the `dist` directories.

## License

MIT
