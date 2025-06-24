# @extremexp/workflow-repository-server

Express server for hosting workflow repositories in the ExtremeXP ecosystem, providing RESTful API access with authentication, user management, and workflow storage capabilities.

## Overview

The Workflow Repository Server provides a centralized hosting solution for XXP workflows and ESPACE experiments, enabling teams to share, collaborate, and manage workflows through a secure web-based API.

## Features

- **RESTful API**: Complete HTTP API for workflow management
- **User Authentication**: JWT-based authentication with user registration
- **Repository Management**: Multi-repository support with access controls
- **Workflow Storage**: Secure storage with metadata and versioning
- **File Attachments**: Support for workflow dependencies and assets
- **Search Capabilities**: Full-text search across workflows and metadata
- **Access Control**: Repository-level and workflow-level permissions
- **Audit Logging**: Track all workflow operations and access

## Installation

### As a Global Service

```bash
npm install -g @extremexp/workflow-repository-server
```

### In a Project

```bash
npm install @extremexp/workflow-repository-server
```

## Usage

### Starting the Server

```bash
# Start with default configuration
workflow-repository-server

# Start with custom configuration
workflow-repository-server --port 8080 --data-dir /var/lib/workflows

# Start with authentication enabled
workflow-repository-server --auth-required --jwt-secret your-secret-key
```

### Server Options

```
Usage: workflow-repository-server [options]

Options:
  --port <number>           Server port (default: 3001)
  --host <string>           Server host (default: "localhost")
  --data-dir <path>         Data directory (default: "./data")
  --auth-required           Require authentication (default: false)
  --jwt-secret <string>     JWT secret key (required if auth enabled)
  --jwt-expiry <string>     JWT token expiry (default: "24h")
  --max-file-size <size>    Max file upload size (default: "10MB")
  --cors-origin <string>    CORS allowed origins (default: "*")
  --verbose                 Enable verbose logging
  -h, --help               Display help information
```

### Environment Variables

```bash
PORT=3001                    # Server port
HOST=0.0.0.0                # Server host
DATA_DIR=./data             # Data storage directory
AUTH_REQUIRED=true          # Require authentication
JWT_SECRET=your-secret-key  # JWT signing secret
JWT_EXPIRY=24h              # Token expiry time
MAX_FILE_SIZE=10MB          # Maximum file upload size
CORS_ORIGIN=*               # CORS allowed origins
VERBOSE=true                # Enable verbose logging
```

## API Reference

### Authentication

#### POST /api/auth/register
Register a new user

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe",
    "email": "john@example.com",
    "password": "securepassword"
  }'
```

Response:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user-001",
    "username": "john.doe",
    "email": "john@example.com"
  }
}
```

#### POST /api/auth/login
Authenticate user and get JWT token

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe",
    "password": "securepassword"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-001",
    "username": "john.doe",
    "email": "john@example.com"
  },
  "expiresAt": "2024-12-25T10:00:00Z"
}
```

### Workflows

#### GET /api/workflows
List workflows

```bash
# List all workflows
curl http://localhost:3001/api/workflows

# List with filtering
curl "http://localhost:3001/api/workflows?author=john.doe&tag=ml&limit=10"

# With authentication
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/workflows
```

Response:
```json
{
  "workflows": [
    {
      "id": "wf-001",
      "name": "ml-classification",
      "description": "Machine learning classification workflow",
      "author": "john.doe",
      "version": "1.0.0",
      "tags": ["ml", "classification", "python"],
      "createdAt": "2024-12-24T10:00:00Z",
      "updatedAt": "2024-12-24T15:30:00Z",
      "size": 2048,
      "attachments": [
        {
          "name": "data.csv",
          "size": 1024,
          "contentType": "text/csv"
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### POST /api/workflows
Upload a new workflow

```bash
curl -X POST http://localhost:3001/api/workflows \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "name=my-workflow" \
  -F "description=My new workflow" \
  -F "tags=experiment,python" \
  -F "workflow=@workflow.xxp" \
  -F "attachments=@data.csv" \
  -F "attachments=@script.py"
```

#### GET /api/workflows/:id
Get workflow details

```bash
curl http://localhost:3001/api/workflows/wf-001
```

#### PUT /api/workflows/:id
Update workflow

```bash
curl -X PUT http://localhost:3001/api/workflows/wf-001 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "tags": ["ml", "classification", "updated"]
  }'
```

#### DELETE /api/workflows/:id
Delete workflow

```bash
curl -X DELETE http://localhost:3001/api/workflows/wf-001 \
  -H "Authorization: Bearer <token>"
```

### Workflow Downloads

#### GET /api/workflows/:id/download
Download workflow file

```bash
curl -O http://localhost:3001/api/workflows/wf-001/download
```

#### GET /api/workflows/:id/attachments/:filename
Download workflow attachment

```bash
curl -O http://localhost:3001/api/workflows/wf-001/attachments/data.csv
```

### Search

#### GET /api/search
Search workflows

```bash
curl "http://localhost:3001/api/search?q=machine%20learning&author=john.doe"
```

Response:
```json
{
  "results": [
    {
      "id": "wf-001",
      "name": "ml-classification",
      "description": "Machine learning classification workflow",
      "author": "john.doe",
      "relevance": 0.95,
      "highlights": {
        "description": "Machine <em>learning</em> classification workflow"
      }
    }
  ],
  "total": 1,
  "query": "machine learning"
}
```

### Repositories

#### GET /api/repositories
List repositories

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/repositories
```

#### POST /api/repositories
Create new repository

```bash
curl -X POST http://localhost:3001/api/repositories \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Workflows",
    "description": "Shared team workflow repository",
    "public": false
  }'
```

## Configuration

### Server Configuration File

Create `server.config.json`:

```json
{
  "server": {
    "port": 3001,
    "host": "0.0.0.0",
    "cors": {
      "origin": ["http://localhost:3000", "https://yourapp.com"],
      "credentials": true
    }
  },
  "storage": {
    "dataDirectory": "./data",
    "maxFileSize": "10MB",
    "allowedExtensions": [".xxp", ".espace", ".py", ".csv", ".json"],
    "backup": {
      "enabled": true,
      "interval": "24h",
      "retention": "30d"
    }
  },
  "auth": {
    "required": true,
    "jwtSecret": "your-secret-key",
    "jwtExpiry": "24h",
    "bcryptRounds": 12,
    "rateLimit": {
      "windowMs": 900000,
      "max": 5
    }
  },
  "search": {
    "enabled": true,
    "indexPath": "./search-index",
    "rebuildInterval": "1h"
  },
  "logging": {
    "level": "info",
    "format": "combined",
    "file": "./server.log",
    "audit": {
      "enabled": true,
      "file": "./audit.log"
    }
  }
}
```

## Programmatic Usage

```typescript
import { WorkflowRepositoryServer, ServerConfig } from '@extremexp/workflow-repository-server';

const config: ServerConfig = {
  port: 3001,
  dataDirectory: './data',
  authRequired: true,
  jwtSecret: 'your-secret-key'
};

const server = new WorkflowRepositoryServer(config);

// Start server
await server.start();
console.log('Workflow repository server started on port 3001');

// Add custom middleware
server.app.use('/api/custom', (req, res, next) => {
  // Custom middleware logic
  next();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});
```

## Data Storage

### Directory Structure

```
data/
├── workflows/              # Workflow files
│   ├── wf-001/
│   │   ├── workflow.xxp
│   │   ├── metadata.json
│   │   └── attachments/
│   │       ├── data.csv
│   │       └── script.py
│   └── wf-002/
│       └── ...
├── users/                  # User data
│   ├── users.json
│   └── sessions/
├── repositories/           # Repository configurations
│   └── repositories.json
├── search-index/           # Search index files
└── backups/               # Backup files
    ├── 2024-12-24/
    └── 2024-12-23/
```

### Database Schema

The server uses JSON files for simplicity, but can be extended to use databases:

```typescript
// User model
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin?: Date;
  repositories: string[];
}

// Workflow model
interface WorkflowRecord {
  id: string;
  name: string;
  description?: string;
  author: string;
  version?: string;
  tags: string[];
  repository: string;
  createdAt: Date;
  updatedAt: Date;
  filePath: string;
  attachments: AttachmentRecord[];
  permissions: {
    public: boolean;
    users: string[];
    groups: string[];
  };
}
```

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting for login attempts
- Session management

### File Security
- File type validation
- Path traversal protection
- File size limits
- Content scanning (optional)

### API Security
- CORS configuration
- Request validation
- SQL injection prevention
- XSS protection

## Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY dist/ ./dist/
RUN mkdir -p /data

EXPOSE 3001
VOLUME ["/data"]

CMD ["node", "dist/server.js", "--data-dir", "/data"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  workflow-repo-server:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - ./data:/data
    environment:
      - AUTH_REQUIRED=true
      - JWT_SECRET=your-secure-secret-key
      - DATA_DIR=/data
    restart: unless-stopped
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name workflows.example.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Handle file uploads
    client_max_body_size 50M;
}
```

## Monitoring & Maintenance

### Health Checks
```bash
# Basic health check
curl http://localhost:3001/health

# Detailed system status
curl http://localhost:3001/api/status
```

### Backup & Recovery
```bash
# Manual backup
curl -X POST http://localhost:3001/api/admin/backup \
  -H "Authorization: Bearer <admin-token>"

# Restore from backup
curl -X POST http://localhost:3001/api/admin/restore \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"backupId": "2024-12-24-001"}'
```

### Log Management
- Request/response logging
- Audit trail for all operations
- Error tracking and alerting
- Performance metrics

## Client Integration

### JavaScript Client
```javascript
import { WorkflowRepositoryClient } from '@extremexp/workflow-repository';

const client = new WorkflowRepositoryClient({
  baseUrl: 'http://localhost:3001',
  token: 'your-jwt-token'
});

// Upload workflow
await client.uploadWorkflow({
  name: 'my-workflow',
  content: workflowContent,
  tags: ['experiment']
});

// List workflows
const workflows = await client.listWorkflows();
```

### VS Code Extension Integration
The server integrates seamlessly with the VS Code extension for:
- Remote repository management
- Workflow browsing and search
- Upload/download operations
- Authentication handling

## Contributing

When extending the server:

1. Follow RESTful API conventions
2. Implement proper authentication and authorization
3. Add comprehensive input validation
4. Include audit logging for sensitive operations
5. Write integration tests for new endpoints
6. Update API documentation

## License

MIT