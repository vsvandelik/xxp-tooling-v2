# @extremexp/core

Core language parsing and utilities for the ExtremeXP ecosystem, providing ANTLR-based parsing for XXP and ESPACE languages.

## Overview

This package serves as the foundation for all ExtremeXP tooling by providing:

- ANTLR4 grammar definitions for XXP and ESPACE languages
- Generated parsers and lexers
- AST (Abstract Syntax Tree) utilities
- Shared type definitions and utilities
- Language-specific analysis capabilities

## Features

### Language Support
- **XXP Language**: Workflow definition language with support for:
  - Parameter definitions and inheritance
  - Task orchestration and dependencies
  - Conditional execution paths
  - Script integration points

- **ESPACE Language**: Experiment space definition language with support for:
  - Parameter space definitions
  - Experiment configurations
  - Workflow references and parameter overrides
  - Execution constraints

### Parsing Capabilities
- Full ANTLR4-based parsing with error recovery
- AST generation with position tracking
- Symbol table construction
- Cross-reference resolution between XXP and ESPACE files

## Installation

```bash
npm install @extremexp/core
```

## Usage

### Basic Parsing

```typescript
import { DocumentParser, DocumentType } from '@extremexp/core';

const parser = new DocumentParser();

// Parse XXP file
const xxpContent = `
workflow MyWorkflow {
  parameter string inputPath;
  
  task processData {
    script: "python process.py ${inputPath}"
  }
}
`;

const xxpResult = parser.parseDocument(xxpContent, DocumentType.XXP);

// Parse ESPACE file
const espaceContent = `
experiment MyExperiment {
  space MySpace {
    workflow MyWorkflow;
    parameter inputPath: ["data1.txt", "data2.txt"];
  }
}
`;

const espaceResult = parser.parseDocument(espaceContent, DocumentType.ESPACE);
```

### Working with AST

For detailed information on working with ANTLR parse trees, visitors, and listeners, please refer to the [ANTLR documentation](https://www.antlr.org/). The generated lexers and parsers follow standard ANTLR patterns for TypeScript/JavaScript targets.

## API Reference

### Core Classes

#### `DocumentParser`
Main parsing interface for XXP and ESPACE documents.

**Methods:**
- `parseDocument(content: string, type: DocumentType): ParseResult`
- `parseXXPDocument(content: string): ParseResult`
- `parseESPACEDocument(content: string): ParseResult`

#### `DocumentType`
Enumeration of supported document types:
- `XXP` - Workflow definition files
- `ESPACE` - Experiment space definition files

### Utility Functions

#### `FileUtils`
- `getDocumentType(uri: string): DocumentType | undefined`
- `isXXPFile(uri: string): boolean`
- `isESPACEFile(uri: string): boolean`

#### `ASTUtils`
- `findNodeAt(tree: ParseTree, position: Position): ParseTree | undefined`
- `getNodeText(node: ParseTree): string`
- `getNodeRange(node: ParseTree): Range`

## Grammar Files

The ANTLR grammar files are located in `src/language/grammar/`:

- `XXP.g4` - XXP language grammar
- `ESPACE.g4` - ESPACE language grammar

To regenerate parsers after grammar changes:

```bash
npm run antlr
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

### Regenerating ANTLR Parsers

```bash
npm run antlr
```

This will regenerate the TypeScript parser files in `src/language/generated/`.

## Architecture

```
src/
├── language/
│   ├── grammar/           # ANTLR grammar files
│   │   ├── XXP.g4
│   │   └── ESPACE.g4
│   └── generated/         # Generated ANTLR parsers
│       ├── XXPLexer.ts
│       ├── XXPParser.ts
│       ├── ESPACELexer.ts
│       └── ESPACEParser.ts
├── utils/                 # Utility functions
│   ├── FileUtils.ts
│   ├── ASTUtils.ts
│   └── PositionUtils.ts
└── index.ts              # Main exports
```

## Contributing

When modifying grammars:

1. Edit the `.g4` files in `src/language/grammar/`
2. Run `npm run antlr` to regenerate parsers
3. Update tests to cover new language features
4. Run `npm test` to verify changes

## License

MIT