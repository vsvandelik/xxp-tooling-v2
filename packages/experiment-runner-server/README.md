# @extremexp/experiment-runner-server

Express server providing remote experiment execution capabilities with WebSocket support for real-time monitoring and API access.

## Overview

The Experiment Runner Server extends the local experiment runner with web-based access, allowing remote execution, monitoring, and management of experiments through a RESTful API and WebSocket connections.

## Features

- **RESTful API**: Complete HTTP API for experiment management
- **WebSocket Support**: Real-time progress updates and notifications
- **Remote Execution**: Execute experiments on server infrastructure
- **Queue Management**: Handle multiple concurrent experiment requests
- **Authentication**: Optional authentication and authorization
- **CORS Support**: Cross-origin resource sharing for web clients
- **Logging**: Comprehensive request and execution logging

## Installation

### As a Global Service

```bash
npm install -g @extremexp/experiment-runner-server
```

### In a Project

```bash
npm install @extremexp/experiment-runner-server
```

## Usage

### Starting the Server

```bash
# Start with default configuration
experiment-runner-server

# Start with environment variables
PORT=8080 DATABASE_PATH=/path/to/experiments.db experiment-runner-server

# Start with verbose logging
VERBOSE=true experiment-runner-server
```

### Configuration

The server is configured through environment variables:

```bash
PORT=3000                           # Server port (default: 3000)
VERBOSE=true                        # Enable verbose logging (default: false)
DATABASE_PATH=./experiment_runs.db  # Database file path (default: ./experiment_runs.db)
MAX_CONCURRENT=3                    # Max concurrent experiments (default: 3)
```

## API Reference

### Experiments

#### POST /api/experiments
Start a new experiment

```bash
curl -X POST http://localhost:3000/api/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Experiment",
    "file": "experiment.espace",
    "parameters": {
      "inputSize": 100,
      "algorithm": "quicksort"
    }
  }'
```

Response:
```json
{
  "id": "exp-20241224-001",
  "status": "queued",
  "message": "Experiment queued for execution"
}
```

#### GET /api/experiments
List all experiments

```bash
curl http://localhost:3000/api/experiments?status=running&limit=10
```

Response:
```json
{
  "experiments": [
    {
      "id": "exp-20241224-001",
      "name": "Test Experiment",
      "status": "running",
      "progress": {
        "completed": 5,
        "total": 12,
        "percentage": 41.7
      },
      "createdAt": "2024-12-24T10:00:00Z",
      "startedAt": "2024-12-24T10:00:05Z"
    }
  ],
  "total": 1
}
```

#### GET /api/experiments/:id
Get experiment details

```bash
curl http://localhost:3000/api/experiments/exp-20241224-001
```

#### POST /api/experiments/:id/stop
Stop a running experiment

```bash
curl -X POST http://localhost:3000/api/experiments/exp-20241224-001/stop
```

#### DELETE /api/experiments/:id
Delete an experiment

```bash
curl -X DELETE http://localhost:3000/api/experiments/exp-20241224-001
```

### File Upload

#### POST /api/upload
Upload experiment files

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@experiment.espace" \
  -F "file=@workflow.xxp"
```

### System Status

#### GET /api/status
Get server status

```bash
curl http://localhost:3000/api/status
```

Response:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "activeExperiments": 2,
  "queuedExperiments": 1,
  "totalExperiments": 45,
  "systemInfo": {
    "memory": {
      "used": 150.5,
      "total": 8000
    },
    "cpu": {
      "usage": 35.2
    }
  }
}
```

## WebSocket API

Connect to WebSocket for real-time updates:

```javascript
const socket = io('http://localhost:3000');

// Join experiment room for updates
socket.emit('join-experiment', 'exp-20241224-001');

// Listen for progress updates
socket.on('experiment-progress', (data) => {
  console.log(`Progress: ${data.completed}/${data.total}`);
});

// Listen for completion
socket.on('experiment-completed', (data) => {
  console.log(`Experiment ${data.id} completed with status: ${data.status}`);
});

// Listen for errors
socket.on('experiment-error', (error) => {
  console.error('Experiment error:', error);
});
```

## Configuration

### Server Configuration File

Create `server.config.json`:

```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "cors": {
      "origin": "*",
      "methods": ["GET", "POST", "PUT", "DELETE"],
      "allowedHeaders": ["Content-Type", "Authorization"]
    }
  },
  "database": {
    "path": "./experiments.db",
    "poolSize": 10
  },
  "execution": {
    "maxConcurrent": 5,
    "queueSize": 50,
    "timeout": 7200
  },
  "uploads": {
    "directory": "./uploads",
    "maxFileSize": "100MB",
    "allowedExtensions": [".xxp", ".espace", ".py"]
  },
  "auth": {
    "required": false,
    "jwtSecret": "your-secret-key",
    "tokenExpiry": "24h"
  },
  "logging": {
    "level": "info",
    "format": "combined",
    "file": "./server.log"
  }
}
```

## Programmatic Usage

```typescript
import { ExperimentRunnerServer, ServerConfig } from '@extremexp/experiment-runner-server';

const config: ServerConfig = {
  port: 3000,
  databasePath: './experiments.db',
  maxConcurrent: 3,
  verbose: true
};

const server = new ExperimentRunnerServer(config);

// Start server
await server.start();
console.log('Server started on port 3000');

// Graceful shutdown
process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});
```

### Custom Routes

```typescript
import { ExperimentRunnerServer } from '@extremexp/experiment-runner-server';

const server = new ExperimentRunnerServer(config);

// Add custom middleware
server.app.use('/custom', (req, res, next) => {
  // Custom logic
  next();
});

// Add custom routes
server.app.get('/api/custom/stats', (req, res) => {
  res.json({ customStats: 'data' });
});

await server.start();
```

## Architecture

```
src/
├── server.ts              # Main server application
├── routes/                # API route handlers
│   ├── experimentRoutes.ts
│   ├── uploadRoutes.ts
│   └── statusRoutes.ts
├── services/              # Business logic services
│   ├── ExperimentService.ts
│   ├── FileService.ts
│   └── WebSocketManager.ts
├── middleware/            # Express middleware
│   ├── authMiddleware.ts
│   ├── corsMiddleware.ts
│   └── errorMiddleware.ts
├── types/                 # Type definitions
│   ├── api.types.ts
│   ├── server.types.ts
│   └── websocket.types.ts
└── utils/                 # Utility functions
    ├── validation.ts
    └── response.ts
```

## Security Considerations

### Authentication (Optional)
```typescript
// Enable JWT authentication
const config = {
  auth: {
    required: true,
    jwtSecret: process.env.JWT_SECRET,
    tokenExpiry: '24h'
  }
};
```

### File Upload Security
- File type validation
- Size limits
- Path traversal protection
- Virus scanning (optional)

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

server.app.use('/api', limiter);
```

## Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY dist/ ./dist/
COPY uploads/ ./uploads/

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### PM2 Deployment

```json
{
  "name": "experiment-runner-server",
  "script": "dist/server.js",
  "instances": 1,
  "exec_mode": "fork",
  "env": {
    "NODE_ENV": "production",
    "PORT": 3000,
    "DATABASE_PATH": "/var/lib/experiments.db"
  }
}
```

## Monitoring

### Health Checks
The server provides health check endpoints:
- `GET /health` - Basic health status
- `GET /health/detailed` - Detailed system information

### Metrics
Integration with monitoring systems:
- Prometheus metrics endpoint
- Request/response logging
- Performance monitoring

## Integration

### VS Code Extension
The server integrates with the VS Code extension for:
- Remote experiment execution
- Real-time progress monitoring
- Result visualization

### CI/CD Integration
Use in continuous integration:
```yaml
# GitHub Actions example
- name: Run experiments
  run: |
    experiment-runner-server --port 3000 &
    SERVER_PID=$!
    # Run tests against server
    kill $SERVER_PID
```

## Contributing

When extending the server:

1. Add new API routes following RESTful conventions
2. Implement proper error handling and validation
3. Add WebSocket events for real-time features
4. Update OpenAPI documentation
5. Add integration tests

## License

MIT