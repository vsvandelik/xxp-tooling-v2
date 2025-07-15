import { WebviewState } from './WebviewState.js';

export class WebviewRenderer {
  static getStyles(): string {
    return `
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
        
        .progress-label {
            font-weight: bold;
            margin-bottom: 5px;
            color: var(--vscode-foreground);
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
    `;
  }

  static renderContent(state: WebviewState): string {
    const percentage = Math.round(state.progress.percentage * 100);

    // Create hierarchical progress details
    const overallProgress = `Overall Spaces: ${state.progress.completedSpaces}/${state.progress.totalSpaces}`;
    const currentSpaceLabel = state.currentSpace
      ? `Current Space (${state.currentSpace})`
      : 'Current Space';
    const spaceProgress = `Parameter Sets: ${state.progress.completedParameterSets}/${state.progress.totalParameterSets}`;
    const taskProgress = `Tasks in Current Set: ${state.progress.completedTasks}/${state.progress.totalTasks}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ExtremeXP Progress</title>
    <style>
        ${this.getStyles()}
    </style>
</head>
<body>
    <div class="header">
        <div class="experiment-name">${state.experimentName}</div>
        <span class="status ${state.status}">${state.status}</span>
    </div>
    
    <div class="progress-section">
        <div class="progress-label">${currentSpaceLabel} Progress</div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="progress-text">${percentage}%</div>
    </div>
    
    <div class="current-info">
        <div class="info-row">
            <span class="info-label">Current Space:</span>
            <span>${state.currentSpace}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Current Task:</span>
            <span>${state.currentTask}</span>
        </div>
        <div class="info-row">
            <span class="info-label">${overallProgress}</span>
        </div>
        <div class="info-row">
            <span class="info-label">${currentSpaceLabel}:</span>
            <span>${spaceProgress}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Current Parameter Set:</span>
            <span>${taskProgress}</span>
        </div>
    </div>
    
    <div class="controls">
        <button id="terminateBtn" ${!state.status || state.status !== 'running' ? 'disabled' : ''}>Terminate</button>
        <button id="resumeBtn" ${!this.isResumeEnabled(state.status) ? 'disabled' : ''}>Resume</button>
        <button id="historyBtn">${state.showHistory ? 'Hide' : 'Show'} History</button>
        <button id="logsBtn">${state.showLogs ? 'Hide' : 'Show'} Logs</button>
    </div>
    
    <div class="history-panel" ${state.showHistory ? '' : 'style="display: none;"'}>
        ${this.renderHistory(state.history)}
    </div>
    
    <div class="logs" ${state.showLogs ? '' : 'style="display: none;"'}>
        ${this.renderLogs(state.logs)}
    </div>
    
    <div class="user-input-dialog ${state.userInputRequest ? 'show' : ''}">
        <h3>User Input Required</h3>
        <p>${state.userInputRequest?.prompt || ''}</p>
        <input type="text" id="userInput" />
        <button onclick="submitUserInput()">Submit</button>
        <button onclick="cancelUserInput()">Cancel</button>
    </div>

    <script>
        ${this.getClientScript()}
    </script>
</body>
</html>`;
  }

  private static isResumeEnabled(status: WebviewState['status']): boolean {
    return (
      status === 'failed' || status === 'idle' || status === 'terminated' || status === 'completed'
    );
  }

  private static renderHistory(history: WebviewState['history']): string {
    return history
      .map(task => {
        const params = Object.entries(task.parameters)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');

        const outputs = Object.entries(task.outputs)
          .map(([k, v]) => {
            if (v.endsWith('.json') || v.endsWith('.txt') || v.endsWith('.csv')) {
              return `${k}: <span class="output-link" onclick="openOutput('${v}')">${v}</span>`;
            }
            return `${k}=${v}`;
          })
          .join(', ');

        return `
        <div class="task-history-item">
          <div class="task-header">
            ${task.taskId} (Space: ${task.spaceId})
            <span class="task-status ${task.status}">${task.status}</span>
          </div>
          <div class="task-params">Parameters: ${params}</div>
          <div class="task-outputs">Outputs: ${outputs}</div>
        </div>
      `;
      })
      .join('');
  }

  private static renderLogs(logs: WebviewState['logs']): string {
    return logs
      .map(
        log =>
          `<div class="log-entry">
        <span class="log-time">${log.time}</span>${log.message}
      </div>`
      )
      .join('');
  }

  private static getClientScript(): string {
    return `
        const vscode = acquireVsCodeApi();
        
        // Event handlers
        document.getElementById('terminateBtn')?.addEventListener('click', () => {
            vscode.postMessage({ type: 'terminate' });
        });
        
        document.getElementById('resumeBtn')?.addEventListener('click', () => {
            vscode.postMessage({ type: 'resume' });
        });
        
        document.getElementById('historyBtn')?.addEventListener('click', () => {
            vscode.postMessage({ type: 'toggleHistory' });
        });
        
        document.getElementById('logsBtn')?.addEventListener('click', () => {
            vscode.postMessage({ type: 'toggleLogs' });
        });
        
        function submitUserInput() {
            const input = document.getElementById('userInput');
            if (input) {
                vscode.postMessage({
                    type: 'userInputResponse',
                    data: {
                        value: input.value
                    }
                });
            }
        }
        
        function cancelUserInput() {
            vscode.postMessage({ type: 'cancelUserInput' });
        }
        
        function openOutput(path) {
            vscode.postMessage({ type: 'openOutput', path: path });
        }
        
        // Enter key submits user input
        document.getElementById('userInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitUserInput();
            }
        });
    `;
  }
}
