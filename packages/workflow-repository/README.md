# ExtremeXP Workflow Repository

The `@extremexp/workflow-repository` package provides a unified client library for managing workflow files across local and remote repositories in the ExtremeXP tooling ecosystem. It offers a consistent interface for storing, retrieving, searching, and organizing workflow definitions.

## Overview

This package implements a flexible repository system that supports multiple storage backends:

- **Local Repositories**: File system-based storage with manifest files and metadata extraction
- **Remote Repositories**: HTTP API-based storage with authentication and ZIP transfer
- **Multi-Repository Management**: Unified interface for working with multiple repositories simultaneously

The library handles both single-file workflows (`.xxp`, `.espace`) and multi-file workflow packages with attachments, providing comprehensive metadata management and search capabilities.

## Architecture

### Core Components

#### Repository Implementations

**LocalWorkflowRepository**
- Manages workflows on the local filesystem
- Supports single-file workflows and directory-based packages
- Extracts metadata from file comments and manifest files
- Generates SHA-256 workflow IDs for uniqueness
- Provides hierarchical folder navigation

**RemoteWorkflowRepository**
- Interfaces with HTTP-based workflow repository servers
- Handles JWT authentication and automatic token refresh
- Uses ZIP format for efficient workflow transfer
- Supports all CRUD operations via REST API

#### Manager Layer

**WorkflowRepositoryManager**
- Coordinates multiple repository instances
- Provides unified search across all configured repositories
- Manages default repository selection
- Handles repository lifecycle and configuration

#### Data Models

- **WorkflowMetadata**: Core workflow information and timestamps
- **WorkflowItem**: Complete workflow with content and attachments
- **WorkflowContent**: Raw workflow data (main file + attachments)
- **WorkflowAttachment**: File metadata for additional resources
- **RepositoryConfig**: Repository connection and authentication settings

## Installation

```bash
npm install @extremexp/workflow-repository
```

## Usage

### Basic Repository Operations

#### Local Repository

```typescript
import { LocalWorkflowRepository, WorkflowContent } from '@extremexp/workflow-repository';

const localRepo = new LocalWorkflowRepository('/path/to/workflows');

// List all workflows
const workflows = await localRepo.list();
console.log(`Found ${workflows.length} workflows`);

// Get a specific workflow
const workflow = await localRepo.get('workflow-id');
if (workflow) {
  console.log(`Workflow: ${workflow.metadata.name}`);
  console.log(`Author: ${workflow.metadata.author}`);
  console.log(`Content: ${workflow.mainFileContent}`);
}

// Upload a new workflow
const content: WorkflowContent = {
  mainFile: `
    // @name Data Processing Pipeline
    // @description Processes CSV data with validation
    // @author John Doe
    // @tags data-processing, csv, validation
    
    experiment DataProcessing {
      workflow CSVProcessor;
    }
  `,
  attachments: new Map([
    ['config.json', Buffer.from('{"timeout": 30}')],
    ['schema.xsd', Buffer.from('<schema>...</schema>')]
  ])
};

const metadata = await localRepo.upload('/pipelines/data-processing', content, {
  name: 'Data Processing Pipeline',
  description: 'Processes CSV data with validation',
  author: 'John Doe',
  tags: ['data-processing', 'csv', 'validation'],
  path: '/pipelines/data-processing',
  mainFile: 'data-processing.espace'
});

console.log(`Uploaded workflow with ID: ${metadata.id}`);
```

#### Remote Repository

```typescript
import { RemoteWorkflowRepository } from '@extremexp/workflow-repository';

const remoteRepo = new RemoteWorkflowRepository(
  'https://workflows.example.com/api',
  'username',
  'password'
);

// Search workflows
const searchResults = await remoteRepo.search({
  query: 'machine learning',
  tags: ['ml', 'training'],
  limit: 10
});

console.log(`Found ${searchResults.length} ML workflows`);

// Download workflow content
const content = await remoteRepo.getContent('workflow-id');
if (content) {
  console.log('Main file:', content.mainFile);
  console.log('Attachments:', Array.from(content.attachments.keys()));
}
```

### Multi-Repository Management

```typescript
import { 
  WorkflowRepositoryManager, 
  RepositoryConfig 
} from '@extremexp/workflow-repository';

const manager = new WorkflowRepositoryManager();

// Configure local repository
const localConfig: RepositoryConfig = {
  type: 'local',
  name: 'local-workflows',
  path: '/home/user/workflows',
  isDefault: true
};

// Configure remote repository
const remoteConfig: RepositoryConfig = {
  type: 'remote',
  name: 'team-workflows',
  path: '',
  url: 'https://workflows.company.com/api',
  authToken: 'user:token123'
};

manager.addRepository(localConfig);
manager.addRepository(remoteConfig);

// Search across all repositories
const allWorkflows = await manager.searchAll({
  query: 'optimization',
  limit: 20
});

console.log(`Found ${allWorkflows.length} optimization workflows across all repos`);

// Get workflow from specific repository
const workflow = await manager.get('workflow-id', 'team-workflows');
```

### Workflow Formats

#### Single-File Workflows

Single-file workflows contain metadata in comments at the top of the file:

```typescript
// @name Image Processing Pipeline
// @description Batch processes images with filters
// @author Alice Smith
// @tags image-processing, batch, filters

experiment ImageProcessing {
  workflow BatchImageProcessor;
  
  space Images {
    parameter inputPath: string;
    parameter outputPath: string;
    parameter filter: "blur" | "sharpen" | "brighten";
    
    task processImages {
      executable: "python";
      arguments: ["process_images.py", "${inputPath}", "${outputPath}", "${filter}"];
    }
  }
}
```

#### Multi-File Workflows

Multi-file workflows use a `workflow.json` manifest with additional files:

**workflow.json:**
```json
{
  "name": "ML Training Pipeline",
  "description": "Complete machine learning training workflow",
  "author": "Data Science Team",
  "tags": ["machine-learning", "training", "pipeline"],
  "mainFile": "training.espace"
}
```

**training.espace:**
```typescript
experiment MLTraining {
  workflow TrainingPipeline;
  
  space Models {
    parameter dataset: string;
    parameter algorithm: "svm" | "random-forest" | "neural-network";
    
    task trainModel {
      executable: "python";
      arguments: ["train.py", "${dataset}", "${algorithm}"];
      inputData: ["config.json", "requirements.txt"];
      outputData: ["model.pkl", "metrics.json"];
    }
  }
}
```

**Additional files:**
- `config.json` - Training configuration
- `requirements.txt` - Python dependencies
- `train.py` - Training script

### Search and Discovery

```typescript
import { WorkflowSearchOptions } from '@extremexp/workflow-repository';

// Advanced search with multiple criteria
const searchOptions: WorkflowSearchOptions = {
  query: 'data processing',
  tags: ['etl', 'transformation'],
  author: 'Data Team',
  path: '/production',
  limit: 50,
  offset: 0
};

const results = await repository.search(searchOptions);

// Browse repository structure
const tree = await repository.getTreeStructure('/machine-learning');
console.log('ML Workflows:');
function printTree(node, indent = '') {
  console.log(`${indent}${node.name} (${node.type})`);
  if (node.children) {
    node.children.forEach(child => printTree(child, indent + '  '));
  }
}
printTree(tree);
```

### Authentication for Remote Repositories

```typescript
import { RemoteWorkflowRepository } from '@extremexp/workflow-repository';

// Using username/password
const repo1 = new RemoteWorkflowRepository(
  'https://api.example.com',
  'username',
  'password'
);

// Using existing auth token (format: username:password)
const repo2 = new RemoteWorkflowRepository(
  'https://api.example.com',
  undefined,
  undefined,
  'user123:token456'
);

// The repository handles JWT token generation and refresh automatically
const workflows = await repo2.list();
```

## Configuration

### Repository Configuration

```typescript
interface RepositoryConfig {
  type: 'local' | 'remote';        // Repository type
  name: string;                    // Unique repository name
  path: string;                    // Local: directory path, Remote: endpoint path
  url?: string;                    // Remote: base API URL
  authToken?: string;              // Remote: authentication token
  isDefault?: boolean;             // Whether to use as default repository
}
```

### Environment Variables

When using the repository in applications, configure via environment variables:

```bash
# Local repository
WORKFLOW_REPO_TYPE=local
WORKFLOW_REPO_PATH=/path/to/workflows

# Remote repository
WORKFLOW_REPO_TYPE=remote
WORKFLOW_REPO_URL=https://workflows.example.com/api
WORKFLOW_REPO_AUTH=username:password
```

## Error Handling

The library provides comprehensive error handling for common scenarios:

```typescript
try {
  const workflow = await repository.get('non-existent-id');
  // workflow will be null if not found
} catch (error) {
  console.error('Repository error:', error.message);
}

try {
  await repository.upload('/path', content, metadata);
} catch (error) {
  if (error.message.includes('already exists')) {
    console.log('Workflow already exists at this path');
  } else if (error.message.includes('authentication')) {
    console.log('Authentication failed - check credentials');
  } else {
    console.error('Upload failed:', error.message);
  }
}
```

## Integration with ExtremeXP Tools

### VS Code Extension

The repository library is used by the VS Code extension for workflow browsing:

```typescript
// In VS Code extension
const manager = new WorkflowRepositoryManager();
manager.addRepository(userConfig);

// Populate workflow tree view
const tree = await manager.getTreeStructure();
vscode.window.createTreeView('workflows', { treeDataProvider: new WorkflowTreeProvider(tree) });
```

### Language Server

Integration with language server for workflow resolution:

```typescript
// In language server
const repository = new LocalWorkflowRepository(workspaceRoot);
const workflow = await repository.get(workflowId);
if (workflow) {
  // Provide completions and validation based on workflow definition
}
```

### Artifact Generator

Using workflows in artifact generation:

```typescript
// In artifact generator
const content = await repository.getContent(workflowId);
const artifactGenerator = new ArtifactGenerator(content.mainFile);
const artifact = await artifactGenerator.generate();
```

## Performance Considerations

- **Caching**: Repository implementations cache metadata for improved performance
- **Lazy Loading**: Large attachments are loaded only when requested
- **Batch Operations**: Use search with pagination for large repositories
- **Connection Pooling**: Remote repositories reuse HTTP connections
- **SHA-256 Hashing**: Workflow IDs are computed efficiently using crypto module

## Extension Points

### Custom Repository Implementation

```typescript
import { IWorkflowRepository } from '@extremexp/workflow-repository';

class DatabaseWorkflowRepository implements IWorkflowRepository {
  constructor(private connectionString: string) {}
  
  async list(path?: string, options?: WorkflowSearchOptions): Promise<readonly WorkflowMetadata[]> {
    // Custom database implementation
  }
  
  // Implement other required methods...
}

// Use with manager
const manager = new WorkflowRepositoryManager();
manager.addRepository(customConfig, new DatabaseWorkflowRepository(connectionString));
```

### Custom Authentication

```typescript
class CustomAuthRemoteRepository extends RemoteWorkflowRepository {
  protected async authenticate(): Promise<string> {
    // Custom authentication logic (OAuth, API keys, etc.)
    return await this.getCustomToken();
  }
}
```

## Testing

The package includes comprehensive test utilities:

```typescript
import { LocalWorkflowRepository } from '@extremexp/workflow-repository';
import { promises as fs } from 'fs';
import * as path from 'path';

// Create test repository
const testDir = await fs.mkdtemp(path.join(__dirname, 'test-repo-'));
const repository = new LocalWorkflowRepository(testDir);

// Test workflow operations
const content: WorkflowContent = {
  mainFile: 'experiment Test { workflow SimpleTest; }',
  attachments: new Map()
};

const metadata = await repository.upload('/test', content, {
  name: 'Test Workflow',
  description: 'Test description',
  author: 'Test Author',
  tags: ['test'],
  path: '/test',
  mainFile: 'test.espace'
});

expect(metadata.name).toBe('Test Workflow');

// Cleanup
await fs.rm(testDir, { recursive: true });
```

## API Reference

### Main Classes

- **LocalWorkflowRepository**: Filesystem-based repository implementation
- **RemoteWorkflowRepository**: HTTP API-based repository implementation
- **WorkflowRepositoryManager**: Multi-repository coordinator

### Interfaces

- **IWorkflowRepository**: Core repository interface
- **WorkflowMetadata**: Workflow metadata structure
- **WorkflowContent**: Raw workflow content
- **RepositoryConfig**: Repository configuration

### Types

- **WorkflowTreeNode**: Hierarchical repository structure
- **WorkflowSearchOptions**: Search and filtering criteria
- **WorkflowAttachment**: File attachment metadata

For detailed API documentation, see the TypeDoc-generated documentation.