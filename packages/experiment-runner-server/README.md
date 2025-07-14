# ExtremeXP Experiment Runner Server

The `@extremexp/experiment-runner-server` package provides a remote HTTP server and WebSocket interface for executing and monitoring ExtremeXP experiments. It enables distributed experiment execution with real-time progress tracking and user interaction capabilities.

## Overview

This package implements a server-based experiment execution platform that extends the core `experiment-runner` functionality with:

- **HTTP REST API**: Complete REST interface for experiment management
- **WebSocket Communication**: Real-time progress updates and bidirectional communication
- **Concurrent Experiment Management**: Support for multiple simultaneous experiments
- **User Input Handling**: Remote user interaction through WebSocket channels
- **Artifact Generation**: Server-side ESPACE to artifact conversion
- **Status Monitoring**: Comprehensive experiment status and history tracking

## Architecture

### Core Components

#### ExperimentRunnerServer
The main HTTP server that orchestrates all experiment operations:

```typescript
import { ExperimentRunnerServer } from '@extremexp/experiment-runner-server';

const server = new ExperimentRunnerServer({
  port: 3000,
  databasePath: './server-experiments.db',
  maxConcurrent: 5,
  verbose: true
});

await server.start();
```

#### ExperimentService
Manages experiment lifecycle and execution:

- Experiment starting, resuming, and termination
- Progress tracking and status monitoring
- User input request handling
- Artifact validation and generation

#### WebSocketManager
Handles real-time communication with clients:

- Client subscription management
- Progress update broadcasting
- User input request/response handling
- Error notification distribution

#### Express Routes
RESTful API endpoints for experiment operations:

- `/api/experiments/run` - Start new experiments
- `/api/experiments/:id/status` - Get experiment status
- `/api/experiments/:id/terminate` - Terminate experiments
- `/api/experiments/:id/history` - Get execution history

## Installation

```bash
npm install @extremexp/experiment-runner-server
```

## Usage

### Starting the Server

#### Programmatic Usage

```typescript
import { ExperimentRunnerServer, ServerConfig } from '@extremexp/experiment-runner-server';

const config: ServerConfig = {
  port: 3000,
  verbose: true,
  databasePath: './experiments.db',
  maxConcurrent: 3
};

const server = new ExperimentRunnerServer(config);

// Start the server
await server.start();
console.log('Server running on port 3000');

// Graceful shutdown
process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});
```

#### Command Line Usage

```bash
# Start with default settings
node server.js

# Start with custom configuration
PORT=8080 DATABASE_PATH=./custom.db MAX_CONCURRENT=5 VERBOSE=true node server.js
```

#### Environment Variables

- `PORT`: Server port (default: 3000)
- `DATABASE_PATH`: SQLite database path (default: ./experiment_runs.db)
- `MAX_CONCURRENT`: Maximum concurrent experiments (default: 3)
- `VERBOSE`: Enable request logging (default: false)

## REST API

### Start Experiment

**POST** `/api/experiments/run`

```json
{
  "artifactPath": "/path/to/experiment.json",
  "experimentId": "optional-custom-id",
  "resume": false
}
```

**Response:**
```json
{
  "experimentId": "exp_1672531200000_abc123def",
  "status": "started"
}
```

### Get Experiment Status

**GET** `/api/experiments/:experimentId/status`

**Response:**
```json
{
  "runId": "run_1672531200000_xyz789",
  "experimentName": "MyExperiment",
  "experimentVersion": "1.0",
  "status": "running",
  "progress": {
    "completedSpaces": 2,
    "totalSpaces": 5,
    "completedParameterSets": 8,
    "totalParameterSets": 20,
    "completedTasks": 16,
    "totalTasks": 40
  },
  "currentSpace": "space3"
}
```

### Terminate Experiment

**POST** `/api/experiments/:experimentId/terminate`

**Response:**
```json
{
  "success": true
}
```

### Submit User Input

**POST** `/api/experiments/:experimentId/input`

```json
{
  "requestId": "req_1672531250000_input123",
  "value": "user response"
}
```

### Get Experiment History

**GET** `/api/experiments/:experimentId/history?limit=10&offset=0&spaceId=space1&taskId=task1`

**Response:**
```json
{
  "experimentId": "exp_1672531200000_abc123def",
  "tasks": [
    {
      "taskId": "task1",
      "spaceId": "space1",
      "paramSetIndex": 0,
      "parameters": {
        "inputFile": "/data/dataset1.csv",
        "algorithm": "quicksort"
      },
      "outputs": {
        "resultFile": "/output/result1.txt",
        "executionTime": "2.3"
      },
      "status": "completed",
      "startTime": 1672531210000,
      "endTime": 1672531212300
    }
  ],
  "total": 1,
  "hasMore": false
}
```

### Get Active Experiments

**GET** `/api/experiments/active`

**Response:**
```json
{
  "experiments": [
    {
      "id": "exp_1672531200000_abc123def",
      "experimentName": "MyExperiment",
      "experimentVersion": "1.0",
      "artifactPath": "/experiments/my-experiment.json",
      "status": {
        "status": "running",
        "progress": {
          "completedSpaces": 2,
          "totalSpaces": 5
        }
      },
      "startTime": 1672531200000
    }
  ]
}
```

### Generate Artifact

**POST** `/api/experiments/generate-artifact`

```json
{
  "espacePath": "/path/to/experiment.espace",
  "outputPath": "/path/to/output.json",
  "validateOnly": false
}
```

**Response:**
```json
{
  "success": true,
  "validation": {
    "errors": [],
    "warnings": [],
    "isValid": true
  },
  "artifactPath": "/path/to/output.json"
}
```

### Validate Artifact

**POST** `/api/experiments/validate-artifact`

```json
{
  "artifactPath": "/path/to/experiment.json"
}
```

**Response:**
```json
{
  "errors": [],
  "warnings": [
    "No input data specified for task 'data-processing'"
  ],
  "isValid": true
}
```

## WebSocket API

### Connection

Connect to the WebSocket endpoint:

```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to experiment server');
});
```

### Subscribe to Experiment Updates

```javascript
// Subscribe to experiment progress
socket.emit('subscribe', 'exp_1672531200000_abc123def');

socket.on('subscribed', (data) => {
  console.log('Subscribed to experiment:', data.experimentId);
});
```

### Handle Progress Updates

```javascript
socket.on('progress', (progress) => {
  console.log('Progress update:', progress);
  // {
  //   experimentId: 'exp_1672531200000_abc123def',
  //   status: 'running',
  //   progress: {
  //     percentage: 0.4,
  //     completedSpaces: 2,
  //     totalSpaces: 5,
  //     ...
  //   },
  //   timestamp: 1672531250000
  // }
});
```

### Handle User Input Requests

```javascript
socket.on('inputRequired', (request) => {
  console.log('User input required:', request.prompt);
  
  // Get user input (e.g., from UI)
  const userInput = await getUserInput(request.prompt);
  
  // Submit response
  socket.emit('userInput', {
    requestId: request.requestId,
    value: userInput
  });
});

socket.on('userInputAck', (ack) => {
  console.log('Input submitted:', ack.success);
});
```

### Handle Experiment Completion

```javascript
socket.on('complete', (data) => {
  console.log('Experiment completed:', data.experimentId);
  console.log('Result:', data.result);
});

socket.on('error', (data) => {
  console.error('Experiment error:', data.error.message);
});
```

### Request Status and History

```javascript
// Request current status
socket.emit('requestStatus', 'exp_1672531200000_abc123def');

socket.on('status', (data) => {
  console.log('Current status:', data.status);
});

// Request execution history
socket.emit('requestHistory', {
  experimentId: 'exp_1672531200000_abc123def',
  limit: 10,
  offset: 0
});

socket.on('history', (data) => {
  console.log('Task history:', data.tasks);
});
```

### Unsubscribe

```javascript
socket.emit('unsubscribe', 'exp_1672531200000_abc123def');

socket.on('unsubscribed', (data) => {
  console.log('Unsubscribed from:', data.experimentId);
});
```

## Client Integration

### Web Client Example

```html
<!DOCTYPE html>
<html>
<head>
  <script src="/socket.io/socket.io.js"></script>
</head>
<body>
  <div id="status"></div>
  <div id="progress"></div>
  
  <script>
    const socket = io();
    const experimentId = 'exp_1672531200000_abc123def';
    
    // Subscribe to experiment
    socket.emit('subscribe', experimentId);
    
    // Handle progress updates
    socket.on('progress', (progress) => {
      document.getElementById('status').textContent = progress.status;
      document.getElementById('progress').textContent = 
        `${(progress.progress.percentage * 100).toFixed(1)}%`;
    });
    
    // Handle user input requests
    socket.on('inputRequired', (request) => {
      const input = prompt(request.prompt);
      socket.emit('userInput', {
        requestId: request.requestId,
        value: input
      });
    });
  </script>
</body>
</html>
```

### Node.js Client Example

```typescript
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

class ExperimentClient {
  private socket: Socket;
  private baseUrl: string;
  
  constructor(serverUrl: string) {
    this.baseUrl = `${serverUrl}/api/experiments`;
    this.socket = io(serverUrl);
    this.setupSocketHandlers();
  }
  
  async startExperiment(artifactPath: string): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/run`, {
      artifactPath
    });
    
    const experimentId = response.data.experimentId;
    this.socket.emit('subscribe', experimentId);
    return experimentId;
  }
  
  private setupSocketHandlers(): void {
    this.socket.on('progress', (progress) => {
      console.log(`Progress: ${(progress.progress.percentage * 100).toFixed(1)}%`);
    });
    
    this.socket.on('inputRequired', async (request) => {
      const input = await this.getUserInput(request.prompt);
      this.socket.emit('userInput', {
        requestId: request.requestId,
        value: input
      });
    });
    
    this.socket.on('complete', (data) => {
      console.log('Experiment completed:', data.result.status);
    });
  }
  
  private async getUserInput(prompt: string): Promise<string> {
    // Implement user input logic
    return 'default response';
  }
}

// Usage
const client = new ExperimentClient('http://localhost:3000');
const experimentId = await client.startExperiment('./experiment.json');
```

## Configuration

### Server Configuration

```typescript
interface ServerConfig {
  port: number;                    // HTTP server port
  verbose?: boolean;               // Enable request logging
  databasePath?: string;          // SQLite database file path
  maxConcurrent?: number;         // Maximum concurrent experiments
}
```

### Security Considerations

The server currently runs without authentication. For production use, consider:

- Adding authentication middleware
- Implementing rate limiting
- Securing WebSocket connections
- Validating file paths and access permissions
- Adding HTTPS support

## Error Handling

The server provides comprehensive error handling:

```typescript
// HTTP errors return standard error responses
{
  "error": "Error description",
  "message": "Detailed error message"
}

// WebSocket errors are emitted as events
socket.on('error', (data) => {
  console.error('Error:', data.error.message);
  console.error('Stack:', data.error.stack);
});
```

## Performance Considerations

- **Concurrent Limit**: Configure `maxConcurrent` based on system resources
- **Database Connections**: Server manages SQLite connections efficiently
- **WebSocket Scaling**: Consider Redis adapter for multi-server deployments
- **Memory Usage**: Monitor memory usage with large experiments
- **Progress Updates**: Progress callbacks are optimized for minimal overhead

## Monitoring and Debugging

### Health Check

**GET** `/health`

```json
{
  "status": "ok",
  "timestamp": "2023-12-31T12:00:00.000Z"
}
```

### Logging

Enable verbose logging for debugging:

```bash
VERBOSE=true node server.js
```

This will log all HTTP requests and WebSocket events.

### Metrics

Monitor server performance:

```javascript
const wsManager = server.getWebSocketManager();
console.log('Connected clients:', wsManager.getConnectedClients());
console.log('Experiment subscribers:', wsManager.getExperimentSubscribers(experimentId));

const experimentService = server.getExperimentService();
console.log('Active experiments:', experimentService.getActiveExperiments().length);
```

## Extension Points

### Custom Experiment Service

```typescript
class CustomExperimentService extends ExperimentService {
  async startExperiment(artifactPath: string, options: any): Promise<string> {
    // Add custom logic before/after starting
    return super.startExperiment(artifactPath, options);
  }
}
```

### Custom WebSocket Events

```typescript
class CustomWebSocketManager extends WebSocketManager {
  initialize(): void {
    super.initialize();
    
    // Add custom event handlers
    this.io.on('connection', (socket) => {
      socket.on('customEvent', (data) => {
        // Handle custom events
      });
    });
  }
}
```

### Custom Routes

```typescript
import { Router } from 'express';

function createCustomRoutes(): Router {
  const router = Router();
  
  router.get('/custom-endpoint', (req, res) => {
    res.json({ message: 'Custom endpoint' });
  });
  
  return router;
}

// Add to server
app.use('/api/custom', createCustomRoutes());
```

## API Reference

### Main Classes

- **ExperimentRunnerServer**: HTTP server and main orchestrator
- **ExperimentService**: Experiment lifecycle management
- **WebSocketManager**: Real-time communication manager

### Key Interfaces

- **ServerConfig**: Server configuration options
- **ExperimentProgress**: Progress update structure
- **UserInputRequest/Response**: User interaction types
- **TaskHistoryItem**: Execution history record

### Type Definitions

- **StartExperimentRequest/Response**: Experiment start API types
- **ExperimentHistoryRequest/Response**: History query API types
- **GenerateArtifactRequest/Response**: Artifact generation API types
- **ValidationResult**: Artifact validation result
- **ActiveExperiment**: Active experiment metadata

For detailed API documentation, see the TypeDoc-generated documentation.