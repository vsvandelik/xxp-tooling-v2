import * as vscode from 'vscode';
import { ExperimentService } from '../services/ExperimentService.js';
import { ExperimentProgress, UserInputRequest } from '../types/experiment.types.js';
import { RunResult } from '@extremexp/experiment-runner';

export class ProgressPanel {
  private panel: vscode.WebviewPanel;
  private experimentId: string | null = null;
  private disposed = false;

  constructor(
    private context: vscode.ExtensionContext,
    private experimentService: ExperimentService
  ) {
    this.panel = vscode.window.createWebviewPanel(
      'extremexpProgress',
      'ExtremeXP Progress',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getWebviewContent();
    this.setupMessageHandlers();

    this.panel.onDidDispose(() => {
      this.disposed = true;
    });
  }

  setExperimentId(experimentId: string): void {
    this.experimentId = experimentId;
    this.panel.webview.postMessage({
      type: 'setExperimentId',
      experimentId,
    });

    // Register user input handler
    this.experimentService.registerUserInputHandler(experimentId, request => {
      this.handleUserInputRequest(request);
    });
  }

  updateProgress(progress: ExperimentProgress): void {
    this.panel.webview.postMessage({
      type: 'progress',
      data: progress,
    });
  }

  setCompleted(result: RunResult): void {
    this.panel.webview.postMessage({
      type: 'completed',
      data: result,
    });
  }

  setError(error: Error): void {
    this.panel.webview.postMessage({
      type: 'error',
      data: {
        message: error.message,
        stack: error.stack,
      },
    });
  }

  show(): void {
    this.panel.reveal();
  }

  isDisposed(): boolean {
    return this.disposed;
  }

  getExperimentId(): string | null {
    return this.experimentId;
  }

  dispose(): void {
    if (this.experimentId) {
      this.experimentService.unregisterUserInputHandler(this.experimentId);
    }
    this.panel.dispose();
  }

  onDidDispose(callback: () => void): vscode.Disposable {
    return this.panel.onDidDispose(callback);
  }

  private setupMessageHandlers(): void {
    this.panel.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'terminate':
          await this.handleTerminate();
          break;
        case 'showHistory':
          await this.handleShowHistory();
          break;
        case 'userInputResponse':
          await this.handleUserInputResponse(message.data);
          break;
        case 'openOutput':
          await this.handleOpenOutput(message.path);
          break;
      }
    });
  }

  private async handleTerminate(): Promise<void> {
    if (!this.experimentId) return;

    const confirmed = await vscode.window.showWarningMessage(
      'Are you sure you want to terminate this experiment?',
      'Yes',
      'No'
    );

    if (confirmed === 'Yes') {
      const terminated = await this.experimentService.terminateExperiment(this.experimentId);
      if (terminated) {
        this.panel.webview.postMessage({
          type: 'terminated',
        });
      }
    }
  }

  private async handleShowHistory(): Promise<void> {
    if (!this.experimentId) return;

    try {
      const history = await this.experimentService.getExperimentHistory(this.experimentId, {
        limit: 100,
      });

      this.panel.webview.postMessage({
        type: 'history',
        data: history,
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load history: ${error}`);
    }
  }

  private handleUserInputRequest(request: UserInputRequest): void {
    this.panel.webview.postMessage({
      type: 'inputRequired',
      data: request,
    });
  }

  private async handleUserInputResponse(data: { requestId: string; value: string }): Promise<void> {
    if (!this.experimentId) return;

    const serverManager = (this.experimentService as any).serverManager;
    const serverUrl = await serverManager.getServerUrl();
    if (!serverUrl) return;

    await fetch(`${serverUrl}/api/experiments/${this.experimentId}/input`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId: data.requestId,
        value: data.value,
      }),
    });
  }

  private async handleOpenOutput(path: string): Promise<void> {
    try {
      const doc = await vscode.workspace.openTextDocument(path);
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open output: ${error}`);
    }
  }

  private getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ExtremeXP Progress</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
        }
        
        .header {
            margin-bottom: 20px;
        }
        
        .experiment-name {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.9em;
            font-weight: bold;
        }
        
        .status.running {
            background-color: var(--vscode-testing-runIcon);
            color: var(--vscode-editor-background);
        }
        
        .status.completed {
            background-color: var(--vscode-testing-iconPassed);
            color: var(--vscode-editor-background);
        }
        
        .status.failed {
            background-color: var(--vscode-testing-iconFailed);
            color: var(--vscode-editor-background);
        }
        
        .status.terminated {
            background-color: var(--vscode-testing-iconSkipped);
            color: var(--vscode-editor-background);
        }
        
        .progress-section {
            margin: 20px 0;
        }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background-color: var(--vscode-progressBar-background);
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            background-color: var(--vscode-progressBar-foreground);
            transition: width 0.3s ease;
        }
        
        .progress-text {
            text-align: center;
            margin: 5px 0;
        }
        
        .current-info {
            margin: 20px 0;
        }
        
        .info-row {
            margin: 5px 0;
        }
        
        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 120px;
        }
        
        .controls {
            margin: 20px 0;
        }
        
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 14px;
            margin-right: 10px;
            cursor: pointer;
            border-radius: 2px;
        }
        
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .logs {
            margin-top: 20px;
            max-height: 300px;
            overflow-y: auto;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            padding: 10px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
        }
        
        .log-entry {
            margin: 2px 0;
        }
        
        .log-time {
            color: var(--vscode-descriptionForeground);
            margin-right: 10px;
        }
        
        .user-input-dialog {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            padding: 20px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            display: none;
        }
        
        .user-input-dialog.show {
            display: block;
        }
        
        .user-input-dialog h3 {
            margin-top: 0;
        }
        
        .user-input-dialog input {
            width: 100%;
            padding: 6px;
            margin: 10px 0;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
        }
        
        .history-panel {
            display: none;
            margin-top: 20px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .history-panel.show {
            display: block;
        }
        
        .task-history-item {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
        }
        
        .task-header {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .task-params, .task-outputs {
            margin: 5px 0;
            font-size: 0.9em;
        }
        
        .task-status {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.8em;
            margin-left: 10px;
        }
        
        .task-status.completed {
            background-color: var(--vscode-testing-iconPassed);
            color: var(--vscode-editor-background);
        }
        
        .task-status.failed {
            background-color: var(--vscode-testing-iconFailed);
            color: var(--vscode-editor-background);
        }
        
        .output-link {
            color: var(--vscode-textLink-foreground);
            cursor: pointer;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="experiment-name" id="experimentName">Waiting for experiment...</div>
        <span class="status" id="status">Initializing</span>
    </div>
    
    <div class="progress-section">
        <div class="progress-bar">
            <div class="progress-fill" id="progressFill" style="width: 0%"></div>
        </div>
        <div class="progress-text" id="progressText">0%</div>
    </div>
    
    <div class="current-info">
        <div class="info-row">
            <span class="info-label">Current Space:</span>
            <span id="currentSpace">-</span>
        </div>
        <div class="info-row">
            <span class="info-label">Current Task:</span>
            <span id="currentTask">-</span>
        </div>
        <div class="info-row">
            <span class="info-label">Progress:</span>
            <span id="progressDetails">Spaces: 0/0 | Tasks: 0/0</span>
        </div>
    </div>
    
    <div class="controls">
        <button id="terminateBtn" onclick="terminate()">Terminate</button>
        <button id="historyBtn" onclick="toggleHistory()">Show History</button>
        <button id="logsBtn" onclick="toggleLogs()">Show Logs</button>
    </div>
    
    <div class="history-panel" id="historyPanel"></div>
    
    <div class="logs" id="logs" style="display: none;"></div>
    
    <div class="user-input-dialog" id="userInputDialog">
        <h3>User Input Required</h3>
        <p id="inputPrompt"></p>
        <input type="text" id="userInput" />
        <button onclick="submitUserInput()">Submit</button>
        <button onclick="cancelUserInput()">Cancel</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentExperimentId = null;
        let currentInputRequest = null;
        let experimentData = null;
        let logs = [];
        
        function terminate() {
            vscode.postMessage({ type: 'terminate' });
        }
        
        function toggleHistory() {
            const panel = document.getElementById('historyPanel');
            const btn = document.getElementById('historyBtn');
            
            if (panel.classList.contains('show')) {
                panel.classList.remove('show');
                btn.textContent = 'Show History';
            } else {
                panel.classList.add('show');
                btn.textContent = 'Hide History';
                vscode.postMessage({ type: 'showHistory' });
            }
        }
        
        function toggleLogs() {
            const logsDiv = document.getElementById('logs');
            const btn = document.getElementById('logsBtn');
            
            if (logsDiv.style.display === 'none') {
                logsDiv.style.display = 'block';
                btn.textContent = 'Hide Logs';
                logsDiv.scrollTop = logsDiv.scrollHeight;
            } else {
                logsDiv.style.display = 'none';
                btn.textContent = 'Show Logs';
            }
        }
        
        function submitUserInput() {
            if (!currentInputRequest) return;
            
            const value = document.getElementById('userInput').value;
            vscode.postMessage({
                type: 'userInputResponse',
                data: {
                    requestId: currentInputRequest.requestId,
                    value: value
                }
            });
            
            hideUserInputDialog();
        }
        
        function cancelUserInput() {
            hideUserInputDialog();
        }
        
        function showUserInputDialog(request) {
            currentInputRequest = request;
            document.getElementById('inputPrompt').textContent = request.prompt;
            document.getElementById('userInput').value = '';
            document.getElementById('userInputDialog').classList.add('show');
            document.getElementById('userInput').focus();
        }
        
        function hideUserInputDialog() {
            currentInputRequest = null;
            document.getElementById('userInputDialog').classList.remove('show');
        }
        
        function addLog(message) {
            const time = new Date().toLocaleTimeString();
            logs.push({ time, message });
            
            const logsDiv = document.getElementById('logs');
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.innerHTML = '<span class="log-time">' + time + '</span>' + message;
            logsDiv.appendChild(entry);
            
            // Auto-scroll to bottom
            logsDiv.scrollTop = logsDiv.scrollHeight;
        }
        
        function updateProgress(progress) {
            const percentage = Math.round(progress.progress.percentage * 100);
            document.getElementById('progressFill').style.width = percentage + '%';
            document.getElementById('progressText').textContent = percentage + '%';
            
            document.getElementById('currentSpace').textContent = progress.currentSpace || '-';
            document.getElementById('currentTask').textContent = progress.currentTask || '-';
            
            const details = 'Spaces: ' + progress.progress.completedSpaces + '/' + progress.progress.totalSpaces +
                          ' | Tasks: ' + progress.progress.completedTasks + '/' + progress.progress.totalTasks;
            document.getElementById('progressDetails').textContent = details;
            
            // Update status
            const statusEl = document.getElementById('status');
            statusEl.textContent = progress.status;
            statusEl.className = 'status ' + progress.status;
            
            // Add log entry
            if (progress.currentTask) {
                addLog('Started task: ' + progress.currentTask);
            }
        }
        
        function displayHistory(history) {
            const panel = document.getElementById('historyPanel');
            panel.innerHTML = '';
            
            history.forEach(task => {
                const item = document.createElement('div');
                item.className = 'task-history-item';
                
                const params = Object.entries(task.parameters)
                    .map(([k, v]) => k + '=' + v)
                    .join(', ');
                    
                const outputs = Object.entries(task.outputs)
                    .map(([k, v]) => {
                        if (v.endsWith('.json') || v.endsWith('.txt') || v.endsWith('.csv')) {
                            return k + ': <span class="output-link" onclick="openOutput(''' + v + ''')">' + v + '</span>';
                        }
                        return k + '=' + v;
                    })
                    .join(', ');
                
                item.innerHTML = \`
                    <div class="task-header">
                        \${task.taskId} (Space: \${task.spaceId})
                        <span class="task-status \${task.status}">\${task.status}</span>
                    </div>
                    <div class="task-params">Parameters: \${params}</div>
                    <div class="task-outputs">Outputs: \${outputs}</div>
                \`;
                
                panel.appendChild(item);
            });
        }
        
        function openOutput(path) {
            vscode.postMessage({ type: 'openOutput', path: path });
        }
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'setExperimentId':
                    currentExperimentId = message.experimentId;
                    document.getElementById('experimentName').textContent = 'Experiment: ' + message.experimentId;
                    addLog('Experiment started: ' + message.experimentId);
                    break;
                    
                case 'progress':
                    updateProgress(message.data);
                    break;
                    
                case 'completed':
                    experimentData = message.data;
                    document.getElementById('status').textContent = 'Completed';
                    document.getElementById('status').className = 'status completed';
                    document.getElementById('terminateBtn').disabled = true;
                    addLog('Experiment completed successfully');
                    break;
                    
                case 'error':
                    document.getElementById('status').textContent = 'Failed';
                    document.getElementById('status').className = 'status failed';
                    document.getElementById('terminateBtn').disabled = true;
                    addLog('ERROR: ' + message.data.message);
                    break;
                    
                case 'terminated':
                    document.getElementById('status').textContent = 'Terminated';
                    document.getElementById('status').className = 'status terminated';
                    document.getElementById('terminateBtn').disabled = true;
                    addLog('Experiment terminated by user');
                    break;
                    
                case 'inputRequired':
                    showUserInputDialog(message.data);
                    break;
                    
                case 'history':
                    displayHistory(message.data);
                    break;
            }
        });
        
        // Enter key submits user input
        document.getElementById('userInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitUserInput();
            }
        });
    </script>
</body>
</html>`;
  }
}
