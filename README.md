# ExtremEXP

A TypeScript monorepo containing multiple packages for the ExtremEXP project.

## Packages

- **@extremexp/core** - Core utilities and shared functionality
- **@extremexp/artifact-generator** - Artifact generation utilities
- **@extremexp/vs-code-extension** - VS Code extension

## Project Structure

```
extremexp/
├── packages/
│   ├── core/                    # Core utilities package
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── artifact-generator/      # Artifact generator package
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── vs-code-extension/       # VS Code extension package
│       ├── src/
│       │   └── extension.ts
│       ├── package.json
│       └── tsconfig.json
├── package.json                 # Root package.json with workspaces
├── tsconfig.json               # Root TypeScript config
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Available Scripts

- `npm run build` - Build all packages
- `npm run build:watch` - Build all packages in watch mode
- `npm run clean` - Clean all build outputs
- `npm run test` - Run tests for all packages

### Development

The project uses TypeScript with strict type checking enabled. All packages are configured with:

- Modern ES2022 target
- Strict type checking
- Composite project references for fast incremental builds
- Source maps and declaration files

### Package Dependencies

- `@extremexp/artifact-generator` depends on `@extremexp/core`
- `@extremexp/vs-code-extension` depends on both `@extremexp/core` and `@extremexp/artifact-generator`

## TypeScript Configuration

The project uses a modern TypeScript setup with:

- **Strict mode**: All strict type checking options enabled
- **Modern target**: ES2022 with ESNext modules
- **Project references**: For fast incremental builds
- **Composite builds**: Optimized for monorepo structure

## Building

To build all packages:

```bash
npm run build
```

To build with watch mode:

```bash
npm run build:watch
```

## Development Workflow

### Initial Setup
```bash
# Install dependencies
npm install

# Build all packages
npm run build
```

### Development Commands
```bash
# Build all packages
npm run build

# Build with watch mode (rebuilds on file changes)
npm run build:watch

# Clean build outputs
npm run clean

# Run tests (when implemented)
npm run test
```

### Working with Individual Packages

You can also run commands for individual packages:

```bash
# Build only the core package
cd packages/core
npm run build

# Build artifact-generator with watch mode
cd packages/artifact-generator
npm run build:watch
```

### Adding Dependencies

For workspace dependencies (internal packages):
```bash
# Add @extremexp/core to artifact-generator (already configured)
# This is handled via package.json dependencies
```

For external dependencies:
```bash
# Add to root (affects all packages)
npm install --save-dev <package-name>

# Add to specific package
npm install --save <package-name> --workspace=@extremexp/core
```

## License

MIT
