# @extremexp/workflow-repository

Client library for managing workflows in the ExtremeXP ecosystem, providing local and remote repository access with comprehensive workflow management capabilities.

## Overview

The Workflow Repository client library enables developers to manage, store, and share XXP workflows and ESPACE experiments through both local file system repositories and remote server-hosted repositories.

## Features

- **Local Repositories**: File system-based workflow storage
- **Remote Repositories**: Server-hosted workflow repositories with authentication
- **Repository Management**: Add, remove, and configure multiple repositories
- **Workflow Operations**: Upload, download, search, and manage workflows
- **Attachment Support**: Handle workflow attachments and dependencies
- **Metadata Management**: Track workflow versions, authors, and descriptions
- **Search Capabilities**: Find workflows by name, author, tags, or content

## Installation

```bash
npm install @extremexp/workflow-repository
```

## Usage

### Basic Repository Operations

```typescript
import { 
  WorkflowRepositoryManager, 
  LocalWorkflowRepository, 
  RemoteWorkflowRepository 
} from '@extremexp/workflow-repository';

// Create repository manager
const manager = new WorkflowRepositoryManager();

// Add local repository
const localRepo = new LocalWorkflowRepository({
  name: 'Local Workflows',
  path: './workflows'
});
await manager.addRepository(localRepo);

// Add remote repository
const remoteRepo = new RemoteWorkflowRepository({
  name: 'Team Workflows',
  url: 'https://workflows.example.com',
  authToken: 'username:password'
});
await manager.addRepository(remoteRepo);
```

### Workflow Management

```typescript
// List all workflows across repositories
const workflows = await manager.listWorkflows();
console.log(`Found ${workflows.length} workflows`);

// Search for specific workflows
const searchResults = await manager.searchWorkflows({
  query: 'machine learning',
  author: 'john.doe',
  tags: ['classification', 'python']
});

// Download a workflow
const workflow = await manager.getWorkflow('ml-classification-v2');
console.log(`Downloaded: ${workflow.name}`);

// Upload a new workflow
await manager.uploadWorkflow({
  name: 'new-experiment',
  content: workflowContent,
  description: 'My new experiment workflow',
  tags: ['experiment', 'data-analysis'],
  attachments: [
    { name: 'data.csv', content: csvData },
    { name: 'script.py', content: pythonScript }
  ]
});
```

### Repository Configuration

```typescript
// Get repository configuration
const config = await manager.getRepositoryConfig('Team Workflows');

// Update repository settings
await manager.updateRepository('Team Workflows', {
  isDefault: true,
  authToken: 'new-token'
});

// Remove repository
await manager.removeRepository('Old Repository');
```

## API Reference

### WorkflowRepositoryManager

Main interface for managing multiple workflow repositories.

#### Methods

##### `addRepository(repository: WorkflowRepository): Promise<void>`
Add a new repository to the manager.

##### `removeRepository(name: string): Promise<void>`
Remove a repository by name.

##### `listRepositories(): WorkflowRepository[]`
Get list of all configured repositories.

##### `getRepository(name: string): WorkflowRepository | undefined`
Get a specific repository by name.

##### `listWorkflows(repositoryName?: string): Promise<WorkflowInfo[]>`
List workflows from all repositories or a specific repository.

##### `searchWorkflows(criteria: SearchCriteria): Promise<WorkflowInfo[]>`
Search for workflows across repositories.

##### `getWorkflow(name: string, repositoryName?: string): Promise<Workflow>`
Download a workflow by name.

##### `uploadWorkflow(workflow: WorkflowUpload): Promise<void>`
Upload a workflow to the default repository.

### LocalWorkflowRepository

File system-based repository implementation.

```typescript
const localRepo = new LocalWorkflowRepository({
  name: 'My Local Workflows',
  path: '/path/to/workflows',
  isDefault: true
});

// Repository will use this directory structure:
// /path/to/workflows/
// ├── workflow1.xxp
// ├── workflow2.xxp
// ├── experiment1.espace
// └── .metadata/
//     ├── workflow1.json
//     ├── workflow2.json
//     └── experiment1.json
```

### RemoteWorkflowRepository

Server-hosted repository implementation.

```typescript
const remoteRepo = new RemoteWorkflowRepository({
  name: 'Company Workflows',
  url: 'https://workflows.company.com',
  authToken: 'username:password', // or JWT token
  isDefault: false
});
```

## Data Types

### WorkflowInfo
```typescript
interface WorkflowInfo {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  size: number;
  repository: string;
  attachments: AttachmentInfo[];
}
```

### Workflow
```typescript
interface Workflow extends WorkflowInfo {
  content: string;  // XXP or ESPACE file content
  metadata: WorkflowMetadata;
}
```

### WorkflowUpload
```typescript
interface WorkflowUpload {
  name: string;
  content: string;
  description?: string;
  author?: string;
  version?: string;
  tags?: string[];
  attachments?: AttachmentUpload[];
}
```

### SearchCriteria
```typescript
interface SearchCriteria {
  query?: string;        // Search in name and description
  author?: string;       // Filter by author
  tags?: string[];       // Filter by tags (AND operation)
  repository?: string;   // Search in specific repository
  dateRange?: {          // Filter by date range
    from?: Date;
    to?: Date;
  };
}
```

## Configuration

### Repository Configuration File

Create `.workflow-repos.json` in your project root:

```json
{
  "repositories": [
    {
      "name": "Local Development",
      "type": "local",
      "path": "./workflows",
      "isDefault": true
    },
    {
      "name": "Team Repository",
      "type": "remote",
      "url": "https://workflows.example.com",
      "authToken": "user:pass",
      "isDefault": false
    }
  ],
  "settings": {
    "autoSync": true,
    "cacheTimeout": 300,
    "maxFileSize": "10MB"
  }
}
```

### Environment Variables

```bash
WORKFLOW_REPOS_CONFIG=./custom-repos.json
WORKFLOW_CACHE_DIR=./cache
WORKFLOW_DEFAULT_AUTHOR=john.doe
WORKFLOW_AUTO_SYNC=true
```

## Advanced Usage

### Custom Repository Implementation

```typescript
import { WorkflowRepository, WorkflowInfo } from '@extremexp/workflow-repository';

export class CustomWorkflowRepository implements WorkflowRepository {
  constructor(private config: CustomConfig) {}

  async listWorkflows(): Promise<WorkflowInfo[]> {
    // Implement custom listing logic
    return [];
  }

  async getWorkflow(name: string): Promise<Workflow> {
    // Implement custom download logic
    throw new Error('Not implemented');
  }

  async uploadWorkflow(workflow: WorkflowUpload): Promise<void> {
    // Implement custom upload logic
  }

  async deleteWorkflow(name: string): Promise<void> {
    // Implement custom deletion logic
  }

  async searchWorkflows(criteria: SearchCriteria): Promise<WorkflowInfo[]> {
    // Implement custom search logic
    return [];
  }
}
```

### Batch Operations

```typescript
// Bulk download workflows
const workflowNames = ['workflow1', 'workflow2', 'workflow3'];
const workflows = await Promise.all(
  workflowNames.map(name => manager.getWorkflow(name))
);

// Bulk upload workflows
const uploads = [
  { name: 'workflow1', content: content1 },
  { name: 'workflow2', content: content2 }
];
await Promise.all(
  uploads.map(upload => manager.uploadWorkflow(upload))
);
```

### Caching and Synchronization

```typescript
// Enable caching for better performance
const manager = new WorkflowRepositoryManager({
  enableCache: true,
  cacheTimeout: 300, // 5 minutes
  autoSync: true     // Auto-sync with remote repositories
});

// Manual cache management
await manager.clearCache();
await manager.syncRepositories();
```

## Error Handling

```typescript
import { 
  RepositoryError, 
  AuthenticationError, 
  WorkflowNotFoundError 
} from '@extremexp/workflow-repository';

try {
  const workflow = await manager.getWorkflow('non-existent');
} catch (error) {
  if (error instanceof WorkflowNotFoundError) {
    console.log('Workflow not found');
  } else if (error instanceof AuthenticationError) {
    console.log('Authentication failed');
  } else if (error instanceof RepositoryError) {
    console.log('Repository error:', error.message);
  }
}
```

## Integration

### VS Code Extension
The library is integrated with the VS Code extension for:
- Repository management UI
- Workflow browser and search
- Drag-and-drop workflow installation
- Automatic workflow synchronization

### CLI Integration
```bash
# Example CLI usage (if CLI wrapper exists)
workflow-repo list
workflow-repo search "machine learning"
workflow-repo download ml-workflow-v2
workflow-repo upload ./my-workflow.xxp --tags "ml,python"
```

## Security Considerations

### Authentication
- Support for username/password and JWT token authentication
- Secure token storage and refresh mechanisms
- Per-repository authentication configuration

### Data Validation
- Workflow content validation before upload
- File type and size restrictions
- Malicious content detection

### Network Security
- HTTPS enforcement for remote repositories
- Certificate validation
- Request timeout and retry mechanisms

## Performance Optimization

### Caching Strategy
- Workflow metadata caching
- Content caching with TTL
- Incremental synchronization
- Lazy loading of workflow content

### Batch Operations
- Parallel download/upload operations
- Connection pooling for remote repositories
- Compression for large workflow files

## Testing

```bash
# Run unit tests
npm test

# Run integration tests with test repositories
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

### Test Configuration

```typescript
// Test with mock repositories
import { MockWorkflowRepository } from '@extremexp/workflow-repository/testing';

const mockRepo = new MockWorkflowRepository();
mockRepo.addWorkflow({
  name: 'test-workflow',
  content: 'workflow TestWorkflow { ... }'
});

const manager = new WorkflowRepositoryManager();
await manager.addRepository(mockRepo);
```

## Contributing

When extending the workflow repository:

1. Implement the `WorkflowRepository` interface for new repository types
2. Add proper error handling and validation
3. Include comprehensive tests for new features
4. Update documentation and examples
5. Consider security implications of new features

## License

MIT