# @extremexp/artifact-generator

Command-line tool for generating artifacts from XXP and ESPACE source files, providing automated code generation for the ExtremeXP ecosystem.

## Overview

The Artifact Generator is a CLI tool that parses XXP workflow definitions and ESPACE experiment configurations to generate various output artifacts such as:

- Python execution scripts
- Configuration files  
- Documentation
- Experiment setup files
- Parameter validation scripts

## Features

- **Multi-format Output**: Generate Python scripts, JSON configs, Markdown docs
- **Template-based Generation**: Extensible template system for custom outputs
- **Parameter Resolution**: Handle parameter inheritance and overrides
- **Validation**: Verify workflow and experiment definitions
- **Batch Processing**: Process multiple files in a single run

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
# Generate artifacts from a single XXP file
artifact-generator --input workflow.xxp --output ./generated

# Generate from ESPACE experiment file
artifact-generator --input experiment.espace --output ./generated

# Process multiple files
artifact-generator --input "*.xxp" --input "*.espace" --output ./generated
```

### Command Line Options

```
Usage: artifact-generator [options]

Options:
  -i, --input <files...>     Input XXP or ESPACE files (supports globs)
  -o, --output <directory>   Output directory for generated artifacts
  -t, --template <name>      Template set to use (default: "python")
  -f, --format <formats...>  Output formats: python, json, markdown
  --validate-only            Only validate files without generating
  --verbose                  Enable verbose logging
  -h, --help                 Display help information
```

### Examples

#### Generate Python Scripts
```bash
# Generate Python execution scripts from workflow
artifact-generator -i myworkflow.xxp -o ./scripts -f python

# Generated files:
# ./scripts/myworkflow.py
# ./scripts/config.json
# ./scripts/run.sh
```

#### Generate Documentation
```bash
# Generate Markdown documentation
artifact-generator -i experiment.espace -o ./docs -f markdown

# Generated files:
# ./docs/experiment-overview.md
# ./docs/parameter-reference.md
# ./docs/workflow-diagram.md
```

#### Validation Only
```bash
# Validate files without generating artifacts
artifact-generator --validate-only -i "**/*.xxp" -i "**/*.espace"
```

## Programmatic Usage

```typescript
import { ArtifactGenerator, GeneratorOptions } from '@extremexp/artifact-generator';

const generator = new ArtifactGenerator();

const options: GeneratorOptions = {
  inputFiles: ['workflow.xxp', 'experiment.espace'],
  outputDirectory: './generated',
  templates: ['python', 'markdown'],
  validateOnly: false
};

try {
  const results = await generator.generate(options);
  console.log(`Generated ${results.length} artifacts`);
} catch (error) {
  console.error('Generation failed:', error);
}
```

## Templates

### Built-in Templates

#### Python Template
Generates executable Python scripts with:
- Parameter validation
- Task execution logic
- Error handling and logging
- Configuration file support

#### JSON Template  
Creates structured configuration files:
- Parameter definitions
- Task configurations
- Execution metadata

#### Markdown Template
Produces documentation:
- Workflow diagrams
- Parameter reference
- Usage instructions

### Custom Templates

Create custom templates by extending the base template class:

```typescript
import { BaseTemplate, GeneratorContext } from '@extremexp/artifact-generator';

export class CustomTemplate extends BaseTemplate {
  name = 'custom';
  description = 'Custom output format';

  async generate(context: GeneratorContext): Promise<GeneratedFile[]> {
    // Implement custom generation logic
    return [
      {
        path: 'custom-output.txt',
        content: this.renderTemplate('custom.mustache', context)
      }
    ];
  }
}
```

## Configuration

### Generator Configuration File

Create `.artifactrc.json` in your project root:

```json
{
  "defaultTemplate": "python",
  "outputDirectory": "./generated",
  "templates": {
    "python": {
      "scriptHeader": "#!/usr/bin/env python3",
      "includeDocs": true
    }
  },
  "validation": {
    "strictMode": true,
    "requireDocumentation": false
  }
}
```

## Architecture

```
src/
├── cli.ts                 # Command-line interface
├── generators/            # Code generation engines
│   ├── ArtifactGenerator.ts
│   ├── PythonGenerator.ts
│   ├── JsonGenerator.ts
│   └── MarkdownGenerator.ts
├── templates/             # Template definitions
│   ├── BaseTemplate.ts
│   ├── python/
│   ├── json/
│   └── markdown/
├── parsers/               # Input file parsers
│   ├── XXPParser.ts
│   └── ESPACEParser.ts
├── resolvers/             # Parameter resolution
│   ├── ParameterResolver.ts
│   └── DependencyResolver.ts
├── visitors/              # AST processing
│   ├── GeneratorVisitor.ts
│   └── ValidationVisitor.ts
└── models/                # Data models
    ├── Workflow.ts
    ├── Experiment.ts
    └── Parameter.ts
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
npm run cli:dev -- --input test.xxp --output ./test-output
```

## Error Handling

The generator provides detailed error reporting:

```bash
$ artifact-generator -i invalid.xxp -o ./output

Error: Parse error in invalid.xxp:line 5:12
  Expected 'parameter' or 'task' declaration
  
  workflow Example {
    invalid syntax here
            ^
```

## Integration

### VS Code Extension
The artifact generator is integrated into the VS Code extension and can be triggered via:
- Command palette: "ExtremeXP: Generate Artifact"
- Right-click context menu on XXP/ESPACE files
- Automatic generation on file save (if configured)

### Build Systems
Integrate with build tools:

```json
// package.json
{
  "scripts": {
    "build:artifacts": "artifact-generator -i src/**/*.xxp -o generated/",
    "prebuild": "npm run build:artifacts"
  }
}
```

## Contributing

When adding new templates or generators:

1. Create template class extending `BaseTemplate`
2. Add template files in `src/templates/`
3. Register template in `TemplateRegistry`
4. Add tests covering the new functionality
5. Update documentation

## License

MIT