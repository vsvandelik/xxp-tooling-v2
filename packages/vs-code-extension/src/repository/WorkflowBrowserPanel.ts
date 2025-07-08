import { WorkflowRepositoryManager, WorkflowSearchOptions } from '@extremexp/workflow-repository';
import * as vscode from 'vscode';

import { RepositoryConfigManager } from './RepositoryConfigManager.js';

export class WorkflowBrowserPanel {
  private panel: vscode.WebviewPanel | undefined;
  private disposed = false;

  constructor(
    private context: vscode.ExtensionContext,
    private repositoryManager: WorkflowRepositoryManager,
    private configManager: RepositoryConfigManager
  ) {}

  async show(): Promise<void> {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'workflowBrowser',
      'Workflow Browser',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, 'dist'),
          vscode.Uri.joinPath(this.context.extensionUri, 'resources'),
        ],
      }
    );

    this.panel.webview.html = this.getWebviewContent();
    this.setupMessageHandlers();

    this.panel.onDidDispose(() => {
      this.panel = undefined;
      this.disposed = true;
    });

    await this.loadInitialData();
  }

  isDisposed(): boolean {
    return this.disposed;
  }

  dispose(): void {
    if (this.panel) {
      this.panel.dispose();
    }
    this.disposed = true;
  }

  private async loadInitialData(): Promise<void> {
    const repositories = this.configManager.getRepositories();
    const defaultRepo = this.configManager.getDefaultRepository();

    this.panel?.webview.postMessage({
      type: 'initialize',
      data: {
        repositories: repositories.map(repo => ({
          name: repo.name,
          type: repo.type,
          isDefault: repo.isDefault,
        })),
        defaultRepository: defaultRepo?.name,
      },
    });

    if (defaultRepo) {
      await this.searchWorkflows(defaultRepo.name, {});
    }
  }

  private setupMessageHandlers(): void {
    this.panel?.webview.onDidReceiveMessage(async message => {
      try {
        switch (message.type) {
          case 'search':
            await this.handleSearch(message.data);
            break;
          case 'downloadWorkflow':
            await this.handleDownload(message.data);
            break;
          case 'openWorkflow':
            await this.handleOpenWorkflow(message.data);
            break;
          case 'deleteWorkflow':
            await this.handleDelete(message.data);
            break;
          case 'uploadWorkflow':
            await this.handleUpload(message.data);
            break;
          case 'refreshRepositories':
            await this.loadInitialData();
            break;
          case 'getTags':
            await this.handleGetTags(message.data);
            break;
          case 'getAuthors':
            await this.handleGetAuthors(message.data);
            break;
        }
      } catch (error) {
        this.panel?.webview.postMessage({
          type: 'error',
          data: {
            message: error instanceof Error ? error.message : 'Operation failed',
          },
        });
      }
    });
  }

  private async handleSearch(data: {
    repository: string;
    options: WorkflowSearchOptions;
  }): Promise<void> {
    await this.searchWorkflows(data.repository, data.options);
  }

  private async searchWorkflows(
    repositoryName: string,
    options: WorkflowSearchOptions
  ): Promise<void> {
    try {
      const workflows = await this.repositoryManager.searchWorkflows(options, repositoryName);

      this.panel?.webview.postMessage({
        type: 'searchResults',
        data: {
          repository: repositoryName,
          workflows: workflows,
          total: workflows.length,
        },
      });
    } catch (error) {
      this.panel?.webview.postMessage({
        type: 'error',
        data: {
          message: error instanceof Error ? error.message : 'Search failed',
        },
      });
    }
  }

  private async handleDownload(data: {
    repository: string;
    workflowId: string;
    targetPath?: string;
  }): Promise<void> {
    try {
      const workflow = await this.repositoryManager.getWorkflow(data.workflowId, data.repository);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      let targetFolder: vscode.Uri;

      if (data.targetPath) {
        targetFolder = vscode.Uri.file(data.targetPath);
      } else {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
          const selectedFolder = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Target Folder',
          });

          if (!selectedFolder || selectedFolder.length === 0 || !selectedFolder[0]) {
            return;
          }

          targetFolder = selectedFolder[0];
        } else if (workspaceFolders.length === 1 && workspaceFolders[0]) {
          targetFolder = workspaceFolders[0].uri;
        } else {
          const selectedWorkspace = await vscode.window.showWorkspaceFolderPick();
          if (!selectedWorkspace) {
            return;
          }
          targetFolder = selectedWorkspace.uri;
        }
      }

      await this.downloadWorkflowToFolder(workflow, targetFolder);

      const action = await vscode.window.showInformationMessage(
        `Workflow "${workflow.metadata.name}" downloaded successfully`,
        'Open Folder',
        'Open in VS Code'
      );

      if (action === 'Open Folder') {
        vscode.commands.executeCommand('revealFileInOS', targetFolder);
      } else if (action === 'Open in VS Code') {
        vscode.commands.executeCommand('vscode.openFolder', targetFolder, {
          forceNewWindow: false,
        });
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async downloadWorkflowToFolder(workflow: any, targetFolder: vscode.Uri): Promise<void> {
    const workflowName = workflow.metadata.name.replace(/[^a-zA-Z0-9-_]/g, '-');
    const workflowDir = vscode.Uri.joinPath(targetFolder, workflowName);

    await vscode.workspace.fs.createDirectory(workflowDir);

    // Write main file
    const mainFileUri = vscode.Uri.joinPath(workflowDir, workflow.metadata.mainFile);
    await vscode.workspace.fs.writeFile(mainFileUri, Buffer.from(workflow.mainFileContent, 'utf8'));

    // Write attachments
    const content = await this.repositoryManager
      .getRepository(workflow.metadata.id.split('/')[0])
      ?.getContent(workflow.metadata.id);
    if (content) {
      for (const [fileName, fileData] of content.attachments) {
        const attachmentUri = vscode.Uri.joinPath(workflowDir, fileName);
        await vscode.workspace.fs.writeFile(attachmentUri, fileData);
      }
    }

    // Write manifest
    const manifestUri = vscode.Uri.joinPath(workflowDir, 'workflow.json');
    const manifest = {
      name: workflow.metadata.name,
      description: workflow.metadata.description,
      author: workflow.metadata.author,
      tags: workflow.metadata.tags,
      mainFile: workflow.metadata.mainFile,
    };
    await vscode.workspace.fs.writeFile(
      manifestUri,
      Buffer.from(JSON.stringify(manifest, null, 2), 'utf8')
    );
  }

  private async handleOpenWorkflow(data: {
    repository: string;
    workflowId: string;
  }): Promise<void> {
    try {
      const workflow = await this.repositoryManager.getWorkflow(data.workflowId, data.repository);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const tempUri = vscode.Uri.parse(
        `untitled:${workflow.metadata.name}.${workflow.metadata.mainFile.split('.').pop()}`
      );
      const document = await vscode.workspace.openTextDocument(tempUri);
      const editor = await vscode.window.showTextDocument(document);

      await editor.edit(editBuilder => {
        editBuilder.insert(new vscode.Position(0, 0), workflow.mainFileContent);
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to open workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async handleDelete(data: { repository: string; workflowId: string }): Promise<void> {
    try {
      const workflow = await this.repositoryManager.getWorkflow(data.workflowId, data.repository);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const confirmed = await vscode.window.showWarningMessage(
        `Are you sure you want to delete workflow "${workflow.metadata.name}"?`,
        { modal: true },
        'Delete'
      );

      if (confirmed === 'Delete') {
        const success = await this.repositoryManager.deleteWorkflow(
          data.workflowId,
          data.repository
        );

        if (success) {
          vscode.window.showInformationMessage(
            `Workflow "${workflow.metadata.name}" deleted successfully`
          );

          this.panel?.webview.postMessage({
            type: 'workflowDeleted',
            data: { workflowId: data.workflowId },
          });
        } else {
          throw new Error('Delete operation failed');
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async handleUpload(data: { repository: string }): Promise<void> {
    try {
      const fileUris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: true,
        canSelectMany: false,
        filters: {
          'Workflow Files': ['xxp', 'espace'],
          'All Files': ['*'],
        },
        openLabel: 'Select Workflow File or Folder',
      });
      if (!fileUris || fileUris.length === 0) {
        return;
      }

      const selectedUri = fileUris[0];
      if (!selectedUri) {
        return;
      }

      const stats = await vscode.workspace.fs.stat(selectedUri);

      if (stats.type === vscode.FileType.Directory) {
        await this.uploadWorkflowFolder(selectedUri, data.repository);
      } else {
        await this.uploadWorkflowFile(selectedUri, data.repository);
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  private async uploadWorkflowFolder(folderUri: vscode.Uri, repositoryName: string): Promise<void> {
    // Check if folder contains workflow.json
    const manifestUri = vscode.Uri.joinPath(folderUri, 'workflow.json');
    let manifest: {
      name: string;
      description: string;
      author: string;
      tags: string[];
      mainFile: string;
    };

    try {
      const manifestData = await vscode.workspace.fs.readFile(manifestUri);
      manifest = JSON.parse(Buffer.from(manifestData).toString('utf8'));
    } catch {
      vscode.window.showErrorMessage('Selected folder does not contain a valid workflow.json file');
      return;
    }

    // Read main file
    const mainFileUri = vscode.Uri.joinPath(folderUri, manifest.mainFile);
    const mainFileData = await vscode.workspace.fs.readFile(mainFileUri);
    const mainFileContent = Buffer.from(mainFileData).toString('utf8');

    // Read attachments
    const attachments = new Map<string, Buffer>();
    const files = await vscode.workspace.fs.readDirectory(folderUri);

    for (const [fileName, fileType] of files) {
      if (
        fileType === vscode.FileType.File &&
        fileName !== manifest.mainFile &&
        fileName !== 'workflow.json'
      ) {
        const fileUri = vscode.Uri.joinPath(folderUri, fileName);
        const fileData = await vscode.workspace.fs.readFile(fileUri);
        attachments.set(fileName, Buffer.from(fileData));
      }
    }

    // Prompt for target path
    const targetPath = await vscode.window.showInputBox({
      prompt: 'Enter target path in repository (leave empty for root)',
      placeHolder: 'category/subcategory',
    });

    if (targetPath === undefined) {
      return;
    } // Upload workflow
    await this.repositoryManager.uploadWorkflow(
      targetPath || '',
      { mainFile: mainFileContent, attachments },
      { ...manifest, path: targetPath || '' },
      repositoryName
    );

    vscode.window.showInformationMessage(`Workflow "${manifest.name}" uploaded successfully`);

    // Refresh the current search
    const currentRepo = repositoryName;
    this.panel?.webview.postMessage({
      type: 'refreshSearch',
      data: { repository: currentRepo },
    });
  }

  private async uploadWorkflowFile(fileUri: vscode.Uri, repositoryName: string): Promise<void> {
    const fileName = fileUri.path.split('/').pop() || 'workflow';
    const fileExtension = fileName.split('.').pop() || '';

    if (!['xxp', 'espace'].includes(fileExtension)) {
      vscode.window.showErrorMessage('Only .xxp and .espace files can be uploaded as workflows');
      return;
    }

    // Read file content
    const fileData = await vscode.workspace.fs.readFile(fileUri);
    const fileContent = Buffer.from(fileData).toString('utf8');

    // Prompt for metadata
    const metadata = await this.promptForWorkflowMetadata(fileName);
    if (!metadata) {
      return;
    }

    // Prompt for target path
    const targetPath = await vscode.window.showInputBox({
      prompt: 'Enter target path in repository (leave empty for root)',
      placeHolder: 'category/subcategory',
    });

    if (targetPath === undefined) {
      return;
    }

    // Upload workflow
    await this.repositoryManager.uploadWorkflow(
      targetPath || '',
      { mainFile: fileContent, attachments: new Map() },
      { ...metadata, mainFile: fileName, path: targetPath || '' },
      repositoryName
    );

    vscode.window.showInformationMessage(`Workflow "${metadata.name}" uploaded successfully`);

    // Refresh the current search
    this.panel?.webview.postMessage({
      type: 'refreshSearch',
      data: { repository: repositoryName },
    });
  }

  private async promptForWorkflowMetadata(fileName: string): Promise<
    | {
        name: string;
        description: string;
        author: string;
        tags: string[];
      }
    | undefined
  > {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter workflow name',
      placeHolder: 'My Workflow',
      value: fileName.replace(/\.[^/.]+$/, ''),
    });

    if (!name) return undefined;

    const description = await vscode.window.showInputBox({
      prompt: 'Enter workflow description',
      placeHolder: 'A brief description of the workflow',
    });

    if (description === undefined) return undefined;

    const defaultAuthor = this.configManager.getDefaultAuthor();
    const author = await vscode.window.showInputBox({
      prompt: 'Enter author name',
      placeHolder: 'Your Name',
      value: defaultAuthor,
    });

    if (!author) return undefined;

    // Store as default if no default was set
    if (!defaultAuthor && author.trim()) {
      await this.configManager.setDefaultAuthor(author.trim());
    }

    const tagsInput = await vscode.window.showInputBox({
      prompt: 'Enter tags (comma separated)',
      placeHolder: 'tag1, tag2, tag3',
    });

    const tags = tagsInput
      ? tagsInput
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag)
      : [];

    return {
      name,
      description,
      author,
      tags,
    };
  }

  private async handleGetTags(data: { repository: string }): Promise<void> {
    try {
      const repository = this.repositoryManager.getRepository(data.repository);
      if (!repository) {
        throw new Error('Repository not found');
      }

      let tags: string[] = [];
      if ('getTags' in repository && typeof repository.getTags === 'function') {
        tags = await repository.getTags();
      }

      this.panel?.webview.postMessage({
        type: 'tagsResult',
        data: { repository: data.repository, tags },
      });
    } catch (error) {
      this.panel?.webview.postMessage({
        type: 'error',
        data: {
          message: `Failed to load tags: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  }

  private async handleGetAuthors(data: { repository: string }): Promise<void> {
    try {
      const repository = this.repositoryManager.getRepository(data.repository);
      if (!repository) {
        throw new Error('Repository not found');
      }

      let authors: string[] = [];
      if ('getAuthors' in repository && typeof repository.getAuthors === 'function') {
        authors = await repository.getAuthors();
      }

      this.panel?.webview.postMessage({
        type: 'authorsResult',
        data: { repository: data.repository, authors },
      });
    } catch (error) {
      this.panel?.webview.postMessage({
        type: 'error',
        data: {
          message: `Failed to load authors: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  }

  private getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workflow Browser</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
            line-height: 1.4;
        }
        
        .header {
            margin-bottom: 24px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 16px;
        }
        
        .header h1 {
            margin: 0 0 8px 0;
            color: var(--vscode-foreground);
            font-size: 24px;
            font-weight: 600;
        }
        
        .header p {
            margin: 0;
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
        }
        
        .search-section {
            margin-bottom: 24px;
            background-color: var(--vscode-sideBar-background);
            padding: 16px;
            border-radius: 4px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .search-row {
            display: flex;
            gap: 12px;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .search-row:last-child {
            margin-bottom: 0;
        }
        
        .search-row label {
            min-width: 80px;
            font-weight: 500;
            color: var(--vscode-foreground);
        }
        
        select, input {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 8px 12px;
            border-radius: 2px;
            font-size: 14px;
            flex: 1;
        }
        
        select:focus, input:focus {
            border-color: var(--vscode-focusBorder);
            outline: none;
        }
        
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 2px;
            font-size: 14px;
            font-weight: 500;
            min-width: 80px;
        }
        
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .workflows-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 16px;
        }
        
        .workflow-card {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            padding: 16px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .workflow-card:hover {
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .workflow-title {
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--vscode-textLink-foreground);
            font-size: 16px;
        }
        
        .workflow-meta {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 8px;
        }
        
        .workflow-description {
            font-size: 14px;
            margin-bottom: 12px;
            color: var(--vscode-foreground);
            line-height: 1.4;
        }
        
        .workflow-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 12px;
        }
        
        .tag {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .workflow-actions {
            display: flex;
            gap: 8px;
        }
        
        .action-btn {
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 500;
            flex: 1;
            text-align: center;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
        
        .loading::before {
            content: "";
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid var(--vscode-descriptionForeground);
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s linear infinite;
            margin-right: 8px;
            vertical-align: middle;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .no-results {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
        
        .no-results h3 {
            margin: 0 0 8px 0;
            color: var(--vscode-foreground);
        }
        
        .error {
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        
        .toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .results-info {
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
        }
        
        .toolbar-actions {
            display: flex;
            gap: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Workflow Browser</h1>
        <p>Browse, search, and manage workflows across all configured repositories</p>
    </div>
    
    <div class="search-section">
        <div class="search-row">
            <label>Repository:</label>
            <select id="repositorySelect">
                <option value="">Select Repository</option>
            </select>
            <button onclick="refreshRepositories()" class="secondary">Refresh</button>
        </div>
        
        <div class="search-row">
            <label>Search:</label>
            <input type="text" id="searchQuery" placeholder="Search workflows by name or description..." />
        </div>
        
        <div class="search-row">
            <label>Filters:</label>
            <input type="text" id="authorFilter" placeholder="Author name..." />
            <input type="text" id="tagFilter" placeholder="Tags (comma separated)..." />
            <button onclick="search()">Search</button>
        </div>
    </div>
    
    <div id="errorMessage" class="error" style="display: none;"></div>
    
    <div class="toolbar" id="toolbar" style="display: none;">
        <div class="results-info" id="resultsInfo"></div>
        <div class="toolbar-actions">
            <button onclick="uploadWorkflow()" class="secondary">📤 Upload</button>
        </div>
    </div>
    
    <div id="workflowsContainer">
        <div class="loading">Select a repository to browse workflows</div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentRepositories = [];
        let currentWorkflows = [];
        let currentRepository = '';
        
        function refreshRepositories() {
            vscode.postMessage({ type: 'refreshRepositories' });
        }
        
        function search() {
            const repository = document.getElementById('repositorySelect').value;
            const query = document.getElementById('searchQuery').value;
            const author = document.getElementById('authorFilter').value;
            const tags = document.getElementById('tagFilter').value.split(',').map(t => t.trim()).filter(t => t);
            
            if (!repository) {
                showError('Please select a repository');
                return;
            }
            
            currentRepository = repository;
            showLoading();
            vscode.postMessage({
                type: 'search',
                data: {
                    repository,
                    options: {
                        query: query || undefined,
                        author: author || undefined,
                        tags: tags.length > 0 ? tags : undefined
                    }
                }
            });
        }
        
        function downloadWorkflow(workflowId) {
            const repository = document.getElementById('repositorySelect').value;
            vscode.postMessage({
                type: 'downloadWorkflow',
                data: { repository, workflowId }
            });
        }
        
        function openWorkflow(workflowId) {
            const repository = document.getElementById('repositorySelect').value;
            vscode.postMessage({
                type: 'openWorkflow',
                data: { repository, workflowId }
            });
        }
        
        function deleteWorkflow(workflowId) {
            const repository = document.getElementById('repositorySelect').value;
            vscode.postMessage({
                type: 'deleteWorkflow',
                data: { repository, workflowId }
            });
        }
        
        function uploadWorkflow() {
            const repository = document.getElementById('repositorySelect').value;
            if (!repository) {
                showError('Please select a repository');
                return;
            }
            
            vscode.postMessage({
                type: 'uploadWorkflow',
                data: { repository }
            });
        }
        
        function showLoading() {
            document.getElementById('workflowsContainer').innerHTML = '<div class="loading">Loading workflows...</div>';
            document.getElementById('toolbar').style.display = 'none';
            hideError();
        }
        
        function showError(message) {
            document.getElementById('errorMessage').textContent = message;
            document.getElementById('errorMessage').style.display = 'block';
        }
        
        function hideError() {
            document.getElementById('errorMessage').style.display = 'none';
        }
        
        function displayWorkflows(workflows) {
            const container = document.getElementById('workflowsContainer');
            const toolbar = document.getElementById('toolbar');
            const resultsInfo = document.getElementById('resultsInfo');
            
            if (workflows.length === 0) {
                container.innerHTML = \`
                    <div class="no-results">
                        <h3>No workflows found</h3>
                        <p>Try adjusting your search criteria or upload a new workflow</p>
                    </div>
                \`;
                toolbar.style.display = 'none';
                return;
            }
            
            resultsInfo.textContent = \`\${workflows.length} workflow\${workflows.length === 1 ? '' : 's'} found\`;
            toolbar.style.display = 'flex';
            
            container.innerHTML = '<div class="workflows-grid">' + 
                workflows.map(workflow => \`
                    <div class="workflow-card">
                        <div class="workflow-title">\${escapeHtml(workflow.name)}</div>
                        <div class="workflow-meta">👤 \${escapeHtml(workflow.author)}</div>
                        <div class="workflow-description">\${escapeHtml(workflow.description)}</div>
                        <div class="workflow-tags">
                            \${workflow.tags.map(tag => \`<span class="tag">\${escapeHtml(tag)}</span>\`).join('')}
                        </div>
                        <div class="workflow-actions">
                            <button class="action-btn" onclick="openWorkflow('\${workflow.id}')">📖 Open</button>
                            <button class="action-btn secondary" onclick="downloadWorkflow('\${workflow.id}')">💾 Download</button>
                            <button class="action-btn secondary" onclick="deleteWorkflow('\${workflow.id}')">🗑️ Delete</button>
                        </div>
                    </div>
                \`).join('') + 
            '</div>';
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'initialize':
                    currentRepositories = message.data.repositories;
                    updateRepositorySelect();
                    if (message.data.defaultRepository) {
                        document.getElementById('repositorySelect').value = message.data.defaultRepository;
                        search();
                    }
                    break;
                    
                case 'searchResults':
                    currentWorkflows = message.data.workflows;
                    displayWorkflows(currentWorkflows);
                    hideError();
                    break;
                    
                case 'error':
                    showError(message.data.message);
                    break;
                    
                case 'workflowDeleted':
                    currentWorkflows = currentWorkflows.filter(w => w.id !== message.data.workflowId);
                    displayWorkflows(currentWorkflows);
                    break;
                    
                case 'refreshSearch':
                    if (message.data.repository === currentRepository) {
                        search();
                    }
                    break;
            }
        });
        
        function updateRepositorySelect() {
            const select = document.getElementById('repositorySelect');
            select.innerHTML = '<option value="">Select Repository</option>' +
                currentRepositories.map(repo => 
                    \`<option value="\${repo.name}">\${repo.name} (\${repo.type})\${repo.isDefault ? ' • default' : ''}</option>\`
                ).join('');
        }
        
        // Auto-search when repository changes
        document.getElementById('repositorySelect').addEventListener('change', function() {
            if (this.value) {
                search();
            } else {
                document.getElementById('workflowsContainer').innerHTML = '<div class="loading">Select a repository to browse workflows</div>';
                document.getElementById('toolbar').style.display = 'none';
            }
        });
        
        // Enter key triggers search
        document.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                search();
            }
        });
    </script>
</body>
</html>`;
  }
}
