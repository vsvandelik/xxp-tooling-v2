# @extremexp/core

Core language processing library for the ExtremeXP tooling ecosystem, providing ANTLR-generated parsers, lexers, and shared utilities for ESPACE and XXP domain-specific languages.

## Overview

The core package serves as the foundation for all ExtremeXP language processing, providing:

- **ANTLR-generated parsers and lexers** for ESPACE and XXP languages
- **Grammar definitions** in ANTLR4 format
- **Shared utilities** for consistent naming conventions
- **TypeScript type definitions** for all language constructs

## Architecture

### Language Components

The package supports two domain-specific languages:

#### ESPACE (Experiment Space Definition Language)
- **Purpose**: Define experiments with parameter spaces and control flow
- **File extension**: `.espace`
- **Key constructs**: experiments, spaces, control blocks, parameter definitions

#### XXP (eXtreme eXPeriment Processing Language)  
- **Purpose**: Define workflows with tasks and data flow
- **File extension**: `.xxp`
- **Key constructs**: workflows, tasks, task chains, data definitions

### Generated Components

All language processing components are generated from ANTLR4 grammar files:

```
src/language/generated/
├── ESPACELexer.ts      # ESPACE tokenizer
├── ESPACEParser.ts     # ESPACE syntax parser
├── ESPACEVisitor.ts    # ESPACE tree visitor interface
├── ESPACEListener.ts   # ESPACE tree listener interface
├── XXPLexer.ts         # XXP tokenizer
├── XXPParser.ts        # XXP syntax parser
├── XXPVisitor.ts       # XXP tree visitor interface
└── XXPListener.ts      # XXP tree listener interface
```

### Grammar Definitions

Source grammar files define the language syntax:

```
src/language/grammar/
├── ESPACE.g4          # ESPACE grammar definition
└── XXP.g4             # XXP grammar definition
```

### Utilities

Shared utilities for consistent behavior across the toolchain:

```
src/utils/
└── naming.ts          # File naming conventions
```

## Usage

### ESPACE Language Processing

```typescript
import { 
  ESPACEParser, 
  ESPACELexer, 
  ESPACEVisitor 
} from '@extremexp/core';
import * as antlr from 'antlr4ng';

// Parse ESPACE content
const content = `
experiment MyExperiment {
  space trainingSpace of TrainingWorkflow {
    strategy gridsearch;
    param learningRate = range(0.01, 0.1, 0.01);
  }
  
  control {
    start -> trainingSpace -> end;
  }
}
`;

const input = antlr.CharStream.fromString(content);
const lexer = new ESPACELexer(input);
const tokens = new antlr.CommonTokenStream(lexer);
const parser = new ESPACEParser(tokens);

const tree = parser.program();
```

### XXP Language Processing

```typescript
import { 
  XXPParser, 
  XXPLexer, 
  XXPVisitor 
} from '@extremexp/core';
import * as antlr from 'antlr4ng';

// Parse XXP content
const content = `
workflow TrainingWorkflow {
  define task preprocess;
  define task train;
  define task evaluate;
  
  start -> preprocess -> train -> evaluate -> end;
  
  configure task train {
    implementation "train_model.py";
    param epochs = 100;
    input trainingData;
    output trainedModel;
  }
}
`;

const input = antlr.CharStream.fromString(content);
const lexer = new XXPLexer(input);
const tokens = new antlr.CommonTokenStream(lexer);
const parser = new XXPParser(tokens);

const tree = parser.program();
```

### Context Type Exports

The package exports aliased context types for both languages to avoid naming conflicts:

```typescript
import {
  // ESPACE contexts
  EspaceExperimentHeaderContext,
  EspaceSpaceDeclarationContext,
  EspaceControlBlockContext,
  // XXP contexts
  XxpWorkflowHeaderContext,
  XxpTaskDefinitionContext,
  XxpTaskConfigurationContext
} from '@extremexp/core';
```

### Naming Utilities

```typescript
import { workflowNameToFileName } from '@extremexp/core';

// Convert workflow names to file names
const fileName = workflowNameToFileName('MyBestWorkflow');
// Returns: 'myBestWorkflow.xxp'
```

## Language Syntax

### ESPACE Syntax Examples

```espace
experiment OptimizationExperiment {
  // Define parameter spaces
  space hyperparameterSearch of MLWorkflow {
    strategy gridsearch;
    param learningRate = range(0.001, 0.1, 0.001);
    param batchSize = enum(16, 32, 64, 128);
    param optimizer = enum("adam", "sgd", "rmsprop");
  }
  
  space evaluation of EvaluationWorkflow {
    strategy random;
    param testSplit = 0.2;
  }
  
  // Define control flow
  control {
    start -> hyperparameterSearch -> evaluation -> end;
  }
  
  // Define experiment-level data
  define data dataset = "data/training_set.csv";
}
```

### XXP Syntax Examples

```xxp
workflow MLWorkflow from BaseWorkflow {
  // Define data
  define data trainingData = "data/processed_training.csv";
  define data validationData = "data/processed_validation.csv";
  define data trainedModel;
  
  // Define tasks
  define task preprocess;
  define task train;
  define task validate;
  
  // Define execution order
  start -> preprocess -> train -> validate -> end;
  
  // Configure tasks
  configure task preprocess {
    implementation "preprocessing/clean_data.py";
    input dataset;
    output trainingData, validationData;
  }
  
  configure task train {
    implementation "training/train_model.py";
    param epochs;
    param learningRate;
    param batchSize;
    input trainingData;
    output trainedModel;
  }
  
  configure task validate {
    implementation "validation/validate_model.py";
    input trainedModel, validationData;
    output validationResults;
  }
}
```

## Grammar Features

### ESPACE Grammar Features

- **Experiment declarations** with nested spaces and control blocks
- **Parameter definitions** with enum, range, and value types
- **Control flow** with simple and conditional transitions
- **Strategy statements** (gridsearch, random)
- **Data definitions** at experiment and space levels
- **Task configurations** for parameter overrides

### XXP Grammar Features

- **Workflow declarations** with optional inheritance
- **Task definitions** and execution chains
- **Data definitions** with optional initial values
- **Task configurations** with implementation, parameters, and I/O
- **Support for comments** and flexible whitespace

## File Naming Conventions

The package enforces consistent file naming:

- **ESPACE files**: Use camelCase names, save as `experimentName.espace`
- **XXP files**: Use camelCase names, save as `workflowName.xxp`
- **First letter lowercase**: `workflowNameToFileName("MyWorkflow")` → `"myWorkflow.xxp"`

## Grammar Generation

The ANTLR-generated components are built from source grammars:

```bash
# Regenerate language components from grammar files
npm run antlr
```

This runs the ANTLR4 generator with TypeScript target:
```bash
antlr4ng -Dlanguage=TypeScript -visitor -listener -o src/language/generated/ src/language/grammar/*.g4
```

## Dependencies

- **antlr4ng**: ANTLR4 runtime for TypeScript
- **antlr4-c3**: Code completion support for ANTLR grammars

## Development Dependencies

- **antlr4ng-cli**: ANTLR4 CLI tool for TypeScript generation

## Integration

The core package is designed to be used by:

- **@extremexp/artifact-generator**: For parsing and validation
- **@extremexp/language-server**: For language support in IDEs
- **@extremexp/vs-code-extension**: For VS Code integration
- **Any custom tools** requiring ESPACE/XXP language processing

## Extension

### Custom Visitors

Create custom visitors to process parsed syntax trees:

```typescript
import { ESPACEVisitor } from '@extremexp/core';

class CustomAnalysisVisitor extends ESPACEVisitor<void> {
  visitExperimentDeclaration(ctx: any): void {
    // Custom analysis logic
    this.visitChildren(ctx);
  }
}
```

### Custom Listeners

Use listeners for event-driven processing:

```typescript
import { ESPACEListener } from '@extremexp/core';

class CustomProcessingListener implements ESPACEListener {
  enterExperimentDeclaration(ctx: any): void {
    // Process experiment start
  }
  
  exitExperimentDeclaration(ctx: any): void {
    // Process experiment end
  }
}
```

## Build Process

```bash
# Install dependencies
npm install

# Generate ANTLR components
npm run antlr

# Build TypeScript
npm run build

# Run tests
npm run test
```