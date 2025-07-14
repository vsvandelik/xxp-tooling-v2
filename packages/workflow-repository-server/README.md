# ExtremeXP Workflow Repository Server

The `@extremexp/workflow-repository-server` package provides a centralized HTTP server for managing workflow repositories in the ExtremeXP tooling ecosystem. It offers a RESTful API with authentication, file upload/download, search capabilities, and user management for collaborative workflow development.

## Overview

This server acts as a backend service for the ExtremeXP workflow management system, providing:

- **RESTful API**: Complete HTTP API for workflow CRUD operations
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **File Management**: ZIP-based workflow packaging with attachment support
- **Search & Discovery**: Advanced search with filtering and tree browsing
- **User Management**: In-memory user system with admin and user roles
- **Integration Ready**: Designed to work seamlessly with VS Code extension and workflow-repository client

## Features

### Core Functionality

- **Workflow Storage**: File-based storage with metadata management
- **ZIP Archive Support**: Workflows packaged as ZIP files for efficient transfer
- **Hierarchical Organization**: Folder-based workflow organization with tree browsing
- **Conflict Resolution**: Override confirmation system for workflow updates
- **Metadata Extraction**: Automatic tag and author aggregation across workflows

### Security & Authentication

- **JWT Authentication**: Secure token-based authentication system
- **Role-Based Access**: Admin and user roles with appropriate permissions
- **Owner Authorization**: Workflow owners can modify their own workflows
- **CORS Support**: Configurable cross-origin resource sharing
- **Password Security**: Bcrypt hashing with salt rounds for password storage

### API Features

- **REST Endpoints**: Full CRUD operations for workflows
- **File Upload**: Multipart form data support for workflow packages
- **Search API**: Advanced search with pagination and filtering
- **Tree Browsing**: Hierarchical repository structure exploration
- **Health Monitoring**: Health check endpoint for operational monitoring

## Installation

```bash
npm install @extremexp/workflow-repository-server
```

## Quick Start

### Basic Server Setup

```typescript
import { WorkflowRepositoryServer, ServerConfig } from '@extremexp/workflow-repository-server';

const config: ServerConfig = {
  port: 3001,
  storagePath: './workflow-repository',
  jwtSecret: 'your-secret-key-here',
  corsOrigin: '*'
};

const server = new WorkflowRepositoryServer(config);

// Start the server
await server.start();
console.log('Workflow Repository Server is running!');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  process.exit(0);
});
```

### Environment Configuration

```bash
# Set environment variables
export PORT=3001
export STORAGE_PATH=./workflow-repository
export JWT_SECRET=your-secret-key
export CORS_ORIGIN=http://localhost:3000

# Start the server
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY node_modules/ ./node_modules/

EXPOSE 3001
ENV PORT=3001
ENV STORAGE_PATH=/data/workflows
ENV JWT_SECRET=production-secret-key

VOLUME ["/data/workflows"]

CMD ["node", "dist/server.js"]
```

## REST API Reference

### Authentication Endpoints

#### Login
**POST** `/auth/login`

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### Get Current User
**GET** `/auth/me`  
*Requires: Authorization header with JWT token*

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "username": "admin",
    "role": "admin"
  }
}
```

#### Logout
**POST** `/auth/logout`  
*Requires: Authentication*

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logout successful"
  }
}
```

### Workflow Management

#### List/Search Workflows
**GET** `/workflows?query=search&tags=tag1,tag2&author=user&limit=10&offset=0`

**Response:**
```json
{
  "success": true,
  "data": {
    "workflows": [
      {
        "id": "a1b2c3d4e5f6...",
        "name": "Data Processing Pipeline",
        "description": "ETL pipeline for customer data",
        "author": "John Doe",
        "tags": ["etl", "data-processing"],
        "path": "/pipelines/data-processing",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "modifiedAt": "2024-01-15T14:20:00.000Z",
        "hasAttachments": true,
        "mainFile": "data-processing.espace"
      }
    ],
    "total": 1,
    "offset": 0,
    "limit": 10
  }
}
```

#### Get Workflow Metadata
**GET** `/workflows/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4e5f6...",
    "name": "Data Processing Pipeline",
    "description": "ETL pipeline for customer data",
    "author": "John Doe",
    "tags": ["etl", "data-processing"],
    "path": "/pipelines/data-processing",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "modifiedAt": "2024-01-15T14:20:00.000Z",
    "hasAttachments": true,
    "mainFile": "data-processing.espace"
  }
}
```

#### Download Workflow Content
**GET** `/workflows/:id/content`  
*Returns: ZIP file with workflow content*

**Response Headers:**
```
Content-Type: application/zip
Content-Disposition: attachment; filename="workflow-a1b2c3d4.zip"
```

#### Upload New Workflow
**POST** `/workflows`  
*Requires: Authentication*  
*Content-Type: multipart/form-data*

**Form Data:**
- `workflow`: ZIP file containing workflow
- `path`: Target path (e.g., "/pipelines/new-workflow")

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-workflow-id",
    "name": "New Workflow",
    "path": "/pipelines/new-workflow"
  }
}
```

#### Update Workflow
**PUT** `/workflows/:id`  
*Requires: Authentication & (Owner or Admin)*  
*Content-Type: multipart/form-data*

**Form Data:**
- `workflow`: Updated ZIP file
- `confirmOverride`: "true" (if overriding existing)

#### Delete Workflow
**DELETE** `/workflows/:id`  
*Requires: Authentication & (Owner or Admin)*

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Workflow deleted successfully"
  }
}
```

### Attachment Management

#### Add Attachments
**POST** `/workflows/:id/attachments`  
*Requires: Authentication & (Owner or Admin)*  
*Content-Type: multipart/form-data*

**Form Data:**
- `files`: Multiple files to attach

#### Remove Attachment
**DELETE** `/workflows/:id/attachments/:fileName`  
*Requires: Authentication & (Owner or Admin)*

### Discovery & Navigation

#### Browse Repository Tree
**GET** `/tree` or **GET** `/tree/*path`

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "workflows",
    "path": "/",
    "type": "folder",
    "children": [
      {
        "name": "pipelines",
        "path": "/pipelines",
        "type": "folder",
        "children": [
          {
            "name": "data-processing.espace",
            "path": "/pipelines/data-processing",
            "type": "workflow",
            "metadata": {
              "id": "a1b2c3d4e5f6...",
              "name": "Data Processing Pipeline"
            }
          }
        ]
      }
    ]
  }
}
```

#### Get All Tags
**GET** `/tags`

**Response:**
```json
{
  "success": true,
  "data": {
    "tags": ["etl", "data-processing", "ml", "pipeline"]
  }
}
```

#### Get All Authors
**GET** `/authors`

**Response:**
```json
{
  "success": true,
  "data": {
    "authors": ["John Doe", "Jane Smith", "Data Team"]
  }
}
```

### Utility Endpoints

#### Health Check
**GET** `/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

#### Confirm Override
**POST** `/workflows/confirm-override`  
*Requires: Authentication*

**Request:**
```json
{
  "requestId": "override-request-123"
}
```

## Client Integration

### Using with Workflow Repository Client

```typescript
import { RemoteWorkflowRepository } from '@extremexp/workflow-repository';

// Configure client to use the server
const repository = new RemoteWorkflowRepository(
  'http://localhost:3001',
  'username',
  'password'
);

// All standard repository operations work seamlessly
const workflows = await repository.list();
const workflow = await repository.get('workflow-id');
const content = await repository.getContent('workflow-id');
```

### VS Code Extension Integration

```typescript
// In VS Code extension settings
{
  "extremexp.workflowRepository": {
    "type": "remote",
    "url": "http://localhost:3001",
    "username": "your-username",
    "password": "your-password"
  }
}
```

### cURL Examples

```bash
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# List workflows (with token)
curl -X GET "http://localhost:3001/workflows?limit=10" \
  -H "Authorization: Bearer your-jwt-token"

# Upload workflow
curl -X POST http://localhost:3001/workflows \
  -H "Authorization: Bearer your-jwt-token" \
  -F "workflow=@my-workflow.zip" \
  -F "path=/my-workflows/new-workflow"

# Download workflow
curl -X GET http://localhost:3001/workflows/workflow-id/content \
  -H "Authorization: Bearer your-jwt-token" \
  -o workflow.zip
```

## Configuration

### Server Configuration

```typescript
interface ServerConfig {
  port: number;              // HTTP server port
  storagePath: string;       // Base directory for workflow storage
  jwtSecret: string;         // Secret key for JWT token signing
  corsOrigin?: string;       // CORS origin configuration
}
```

### Environment Variables

```bash
# Server Configuration
PORT=3001                                    # Server port
STORAGE_PATH=./workflow-repository           # Workflow storage directory
JWT_SECRET=your-secret-key                   # JWT signing secret
CORS_ORIGIN=*                               # CORS allowed origins

# Development
NODE_ENV=development                         # Environment mode
DEBUG=workflow-repository-server:*           # Debug logging
```

### Default Users

The server starts with a default admin user:

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `admin`

**⚠️ Important**: Change the default admin password in production environments.

## Security Considerations

### Production Security

```typescript
const productionConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '3001'),
  storagePath: process.env.STORAGE_PATH || '/secure/storage/path',
  jwtSecret: process.env.JWT_SECRET || generateSecureSecret(),
  corsOrigin: process.env.CORS_ORIGIN || 'https://your-domain.com'
};

// Additional security measures
app.use(helmet());                    // Security headers
app.use(rateLimit({                   // Rate limiting
  windowMs: 15 * 60 * 1000,          // 15 minutes
  max: 100                           // Limit each IP to 100 requests per windowMs
}));
```

### Authentication Flow

1. **Login**: Client sends username/password to `/auth/login`
2. **Token Generation**: Server validates credentials and returns JWT token
3. **Request Authorization**: Client includes token in `Authorization: Bearer <token>` header
4. **Token Validation**: Server validates token on each protected request
5. **Auto-Refresh**: Tokens expire after 7 days, requiring re-authentication

### Authorization Levels

- **Public**: Health check, login endpoints
- **Authenticated**: List, read, search operations
- **Owner/Admin**: Create, update, delete operations on workflows

## Error Handling

The server provides comprehensive error responses:

```json
{
  "success": false,
  "error": "Authentication required",
  "code": 401
}
```

### Common Error Codes

- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Authentication required
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource doesn't exist
- **409**: Conflict - Resource already exists
- **500**: Internal Server Error - Server-side error

### Error Handling in Clients

```typescript
try {
  const result = await fetch('/workflows', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const response = await result.json();
  
  if (!response.success) {
    switch (result.status) {
      case 401:
        // Handle authentication error
        redirectToLogin();
        break;
      case 403:
        // Handle authorization error
        showPermissionError();
        break;
      default:
        // Handle other errors
        showError(response.error);
    }
  }
} catch (error) {
  console.error('Network error:', error);
}
```

## Monitoring & Operations

### Health Monitoring

```bash
# Health check
curl http://localhost:3001/health

# Monitor with tools like Prometheus
# GET /health endpoint returns useful metrics
```

### Logging

The server provides structured logging for operations:

```typescript
// Enable debug logging
DEBUG=workflow-repository-server:* npm start

// Production logging
NODE_ENV=production npm start
```

### Backup & Recovery

```bash
# Backup workflow storage
tar -czf workflow-backup-$(date +%Y%m%d).tar.gz /path/to/storage

# Restore from backup
tar -xzf workflow-backup-20240115.tar.gz -C /
```

## Development

### Development Setup

```bash
# Clone and install dependencies
git clone <repository>
cd workflow-repository-server
npm install

# Start development server with hot reload
npm run dev

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Build for production
npm run build
```

### Testing

```typescript
import { WorkflowRepositoryServer } from '@extremexp/workflow-repository-server';
import request from 'supertest';

describe('Workflow Repository Server', () => {
  let server: WorkflowRepositoryServer;
  let app: Express;

  beforeEach(async () => {
    server = new WorkflowRepositoryServer({
      port: 0,
      storagePath: './test-storage',
      jwtSecret: 'test-secret'
    });
    app = server.getApp();
  });

  test('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

## API Client Libraries

### JavaScript/TypeScript

Use the official workflow-repository client:

```typescript
import { RemoteWorkflowRepository } from '@extremexp/workflow-repository';
```

### Python

```python
import requests
import json

class WorkflowRepositoryClient:
    def __init__(self, base_url, username, password):
        self.base_url = base_url
        self.token = self._login(username, password)
    
    def _login(self, username, password):
        response = requests.post(f"{self.base_url}/auth/login", 
                               json={"username": username, "password": password})
        return response.json()["data"]["token"]
    
    def list_workflows(self, query=None, limit=50):
        headers = {"Authorization": f"Bearer {self.token}"}
        params = {"limit": limit}
        if query:
            params["query"] = query
        
        response = requests.get(f"{self.base_url}/workflows", 
                              headers=headers, params=params)
        return response.json()["data"]["workflows"]
```

### cURL Scripts

```bash
#!/bin/bash

# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | \
  jq -r '.data.token')

# Use token for API calls
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/workflows
```

For detailed API documentation and more examples, see the server's OpenAPI specification and TypeDoc-generated documentation.