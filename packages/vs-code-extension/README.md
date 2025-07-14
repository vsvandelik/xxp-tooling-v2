# ExtremeXP VS Code Extension

A comprehensive Visual Studio Code extension providing full support for ExtremeXP workflows and experiments. This extension integrates XXP (workflow definition) and ESPACE (experiment specification) languages with syntax highlighting, language server features, experiment execution, and workflow repository management.

## Features

### Language Support
- **Syntax Highlighting**: Full syntax highlighting for `.xxp` and `.espace` files
- **Language Server Integration**: Code completion, diagnostics, hover information, and references
- **IntelliSense**: Context-aware code completion and parameter suggestions
- **Error Detection**: Real-time validation and error reporting
- **Go to Definition**: Navigate to task, workflow, and parameter definitions

### Experiment Execution
- **Artifact Generation**: Convert ESPACE experiment files to executable JSON artifacts
- **Experiment Runner**: Execute experiments with real-time progress tracking
- **Interactive Experiments**: Handle user input requests during experiment execution
- **Resume Capability**: Resume interrupted experiments from their last state
- **Result Visualization**: View experiment outputs and execution summaries

### Workflow Repository
- **Repository Management**: Connect to local and remote workflow repositories
- **Workflow Browser**: Browse, search, and preview workflows in a tree view
- **Upload/Download**: Upload local workflows and download from repositories
- **Authentication**: Support for authenticated remote repositories
- **Attachment Handling**: Manage workflow attachments and dependencies

### Development Tools
- **Built-in Tool Resolution**: Automatic discovery of ExtremeXP toolchain components
- **Server Management**: Integrated experiment runner server with status monitoring
- **Progress Tracking**: WebView-based progress panels with real-time updates
- **Configuration Management**: Flexible configuration for tools, servers, and repositories

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "ExtremeXP"
4. Click Install

### From VSIX Package
1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions → Install from VSIX
4. Select the downloaded file

### Development Installation
```bash
# Clone the repository
git clone https://github.com/extremexp/xxp-tooling-v2.git
cd xxp-tooling-v2/packages/vs-code-extension

# Install dependencies
npm install

# Build the extension
npm run build

# Package the extension (optional)
npm run package
```

## Quick Start

### 1. Create Your First Workflow

Create a new file with `.xxp` extension:

```xxp
workflow SimpleWorkflow {
    task CalculateSum {
        input: number a, number b
        output: number result
        implement: "./tasks/sum.py"
    }
    
    task DisplayResult {
        input: number value
        implement: "./tasks/display.py"
    }
    
    CalculateSum -> DisplayResult
}
```

### 2. Create an Experiment

Create a new file with `.espace` extension:

```espace
experiment MathExperiment from "SimpleWorkflow" {
    version: "1.0.0"
    description: "Basic math calculation experiment"
    
    space MainSpace {
        CalculateSum {
            param a: 5
            param b: 10
        }
    }
}
```

### 3. Generate and Run

1. **Generate Artifact**: Right-click the `.espace` file → "Generate Artifact"
2. **Run Experiment**: Use Command Palette (Ctrl+Shift+P) → "ExtremeXP: Run Experiment"
3. **Monitor Progress**: The progress panel will open automatically

## Configuration

### Extension Settings

Configure the extension through VS Code settings (`Ctrl+,`):

```json
{
  // Tool Paths (leave empty to use bundled tools)
  "extremexp.tools.artifactgenerator.path": "",
  "extremexp.tools.experimentrunnerserver.path": "",
  "extremexp.tools.languageserver.path": "",
  "extremexp.tools.useBuiltIn": true,
  
  // Server Configuration
  "extremexp.server.port": 3000,
  "extremexp.server.autoStart": true,
  
  // Experiment Configuration
  "extremexp.experiments.defaultDatabase": "",
  
  // Workflow Repository Configuration
  "extremexp.workflows.enabled": true,
  "extremexp.workflows.defaultAuthor": "Your Name",
  "extremexp.workflows.repositories": [
    {
      "name": "Local Repository",
      "type": "local",
      "path": "./workflows",
      "isDefault": true
    }
  ],
  
  // Language Features
  "extremexp.language.validation.strictMode": false,
  "extremexp.language.completion.snippets": true,
  "extremexp.language.completion.autoImport": true,
  "extremexp.language.diagnostics.delay": 500
}
```

### Workflow Repository Setup

#### Local Repository
```json
{
  "name": "My Local Workflows",
  "type": "local",
  "path": "/path/to/workflows",
  "isDefault": true
}
```

#### Remote Repository
```json
{
  "name": "Team Repository",
  "type": "remote",
  "url": "https://workflow-repo.example.com",
  "authToken": "username:password",
  "isDefault": false
}
```

## Commands

The extension provides the following commands:

### Experiment Commands
- `ExtremeXP: Generate Artifact` - Convert ESPACE file to JSON artifact
- `ExtremeXP: Run Experiment` - Execute an experiment from artifact
- `ExtremeXP: Show Progress` - Open the progress tracking panel
- `ExtremeXP: Stop Server` - Stop the experiment runner server
- `ExtremeXP: Restart Server` - Restart the experiment runner server

### Workflow Repository Commands
- `ExtremeXP: Add Repository` - Add a new workflow repository
- `ExtremeXP: Remove Repository` - Remove a repository
- `ExtremeXP: Set Default Repository` - Set the default repository
- `ExtremeXP: Open Workflow Browser` - Open the workflow browser panel
- `ExtremeXP: Upload Current File as Workflow` - Upload active file to repository
- `ExtremeXP: Search Workflows` - Search across all repositories

### Utility Commands
- `ExtremeXP: Clear Tool Cache` - Clear the tool resolution cache
- `ExtremeXP: Restart Language Server` - Restart the language server

## User Interface

### Status Bar
The ExtremeXP status bar item shows:
- **Green**: Server running normally
- **Yellow**: Server stopped
- **Red**: Server error

Click the status bar item to open the progress panel.

### Workflow Repository View
Located in the Explorer sidebar:
- Browse repositories and workflows
- Search and filter workflows
- Upload, download, and manage workflows
- Preview workflow content
- Manage attachments

### Progress Panel
WebView-based panel showing:
- Real-time experiment progress
- Task execution status
- Error messages and logs
- Experiment results and outputs

## Language Features

### XXP Language Support
- Workflow definitions with tasks and data flow
- Parameter configuration and validation
- Inheritance and modular workflow design
- Task chaining with input/output mapping

### ESPACE Language Support
- Experiment specifications with space definitions
- Parameter assignment and override
- Conditional execution and control flow
- Multi-space experiment orchestration

### Language Server Features
- **Code Completion**: Context-aware suggestions for keywords, identifiers, and parameters
- **Diagnostics**: Real-time error detection and validation
- **Hover Information**: Detailed information about symbols and references
- **Go to Definition**: Navigate to task, workflow, and parameter definitions
- **Find References**: Find all usages of symbols across files
- **Document Symbols**: Outline view of workflow and experiment structure

## Workflow Repository Integration

### Repository Types

#### Local Repositories
- File system-based workflow storage
- Direct access to workflow files
- Ideal for personal projects and development

#### Remote Repositories
- HTTP-based workflow repository servers
- Authentication and access control
- Team collaboration and sharing

### Workflow Management
- **Upload**: Upload workflows with metadata and attachments
- **Download**: Download workflows for local development
- **Search**: Full-text search across workflow content
- **Browse**: Hierarchical navigation of workflow collections
- **Preview**: In-editor preview of workflow content

### Authentication
Remote repositories support authentication via:
- Username/password authentication
- Token-based authentication
- JWT token management

## Architecture

### Extension Components

#### Core Services
- **ToolResolver**: Locates ExtremeXP toolchain executables
- **ToolExecutor**: Executes tools with proper arguments and environment
- **ServerManager**: Manages experiment runner server lifecycle
- **ExperimentService**: Handles experiment execution and WebSocket communication

#### Language Integration
- **LanguageClientManager**: Manages language server connection
- **DocumentParser**: Parses XXP and ESPACE files
- **DiagnosticsProvider**: Provides real-time error detection

#### Workflow Repository
- **RepositoryConfigManager**: Manages repository configuration
- **WorkflowRepositoryProvider**: Tree data provider for repository browser
- **WorkflowCommands**: Command handlers for repository operations

#### User Interface
- **ProgressPanelManager**: Manages progress tracking WebViews
- **WebviewController**: Handles WebView lifecycle and communication
- **WorkflowBrowserPanel**: Repository browser interface

### Tool Integration

The extension integrates with the ExtremeXP toolchain:

1. **Artifact Generator** (`@extremexp/artifact-generator`)
   - Converts ESPACE files to executable JSON artifacts
   - Validates experiment syntax and semantics

2. **Experiment Runner Server** (`@extremexp/experiment-runner-server`)
   - Executes experiments with real-time progress tracking
   - Provides WebSocket API for status updates

3. **Language Server** (`@extremexp/language-server`)
   - Provides language features for XXP and ESPACE
   - Handles code completion, diagnostics, and navigation

4. **Workflow Repository** (`@extremexp/workflow-repository`)
   - Manages workflow storage and retrieval
   - Supports local and remote repositories

## Development

### Building the Extension

```bash
# Build TypeScript sources
npm run build

# Watch for changes during development
npm run build:watch

# Bundle tools for distribution
npm run bundle-tools

# Package extension for distribution
npm run package
```

### Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Tool Bundling

The extension can bundle ExtremeXP tools for distribution:

```bash
# Bundle all required tools
npm run bundle-tools

# This creates bundled-tools/ directory with:
# - artifact-generator/
# - experiment-runner-server/
# - language-server/
# - workflow-repository/
```

### Extension Development

For VS Code extension development:

1. Open the project in VS Code
2. Press F5 to launch Extension Development Host
3. Test the extension in the new VS Code window
4. Use VS Code Debug Console for debugging

## Troubleshooting

### Common Issues

#### Language Server Not Starting
1. Check if language server tool is properly resolved
2. Restart the language server: `Ctrl+Shift+P` → "ExtremeXP: Restart Language Server"
3. Check VS Code Developer Tools console for errors

#### Experiment Server Connection Failed
1. Verify server is running: Check status bar item
2. Restart server: `Ctrl+Shift+P` → "ExtremeXP: Restart Server"
3. Check port configuration in settings
4. Ensure no other process is using the port

#### Tool Not Found Errors
1. Verify tool paths in settings
2. Clear tool cache: `Ctrl+Shift+P` → "ExtremeXP: Clear Tool Cache"
3. Check if using bundled tools: `extremexp.tools.useBuiltIn: true`
4. Ensure tools are properly installed if using external paths

#### Workflow Repository Issues
1. Check repository configuration in settings
2. Verify network connectivity for remote repositories
3. Validate authentication credentials
4. Refresh repositories: Click refresh button in repository view

### Debug Information

#### Enable Debug Logging
Add to VS Code settings:
```json
{
  "extremexp.debug.logging": true,
  "extremexp.debug.verboseOutput": true
}
```

#### Check Extension Logs
1. Open VS Code Developer Tools: `Help` → `Toggle Developer Tools`
2. Check Console tab for extension logs
3. Look for ExtremeXP-related messages

#### Extension Output Channels
Check these output channels in VS Code:
- "ExtremeXP Language Server"
- "ExtremeXP Artifact Generation"
- "ExtremeXP Experiment Runner"

## API Reference

### Extension Exports

The extension exports the following API for other extensions:

```typescript
interface ExtremeXPExtensionAPI {
  // Tool Resolution
  resolveTool(toolName: string): Promise<ToolInfo>;
  
  // Experiment Management
  startExperiment(artifactPath: string, options?: ExperimentOptions): Promise<string>;
  terminateExperiment(experimentId: string): Promise<boolean>;
  
  // Workflow Repository
  getRepositories(): RepositoryConfig[];
  addRepository(config: RepositoryConfig): Promise<void>;
}
```

### Events

The extension emits the following events:

```typescript
// Experiment Events
onExperimentStarted(experimentId: string): void;
onExperimentCompleted(experimentId: string, result: RunResult): void;
onExperimentError(experimentId: string, error: Error): void;

// Server Events
onServerStatusChanged(status: 'running' | 'stopped' | 'error'): void;

// Repository Events
onRepositoryAdded(repository: RepositoryConfig): void;
onRepositoryRemoved(repository: RepositoryConfig): void;
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Build the extension: `npm run build`
6. Commit your changes: `git commit -am 'Add new feature'`
7. Push to the branch: `git push origin feature/new-feature`
8. Submit a pull request

### Development Guidelines

- Follow TypeScript coding standards
- Add JSDoc comments for all public APIs
- Include unit tests for new functionality
- Update documentation for user-facing changes
- Test the extension in VS Code Extension Development Host

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/extremexp/xxp-tooling-v2/issues)
- **Documentation**: [Project Wiki](https://github.com/extremexp/xxp-tooling-v2/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/extremexp/xxp-tooling-v2/discussions)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history and changes.