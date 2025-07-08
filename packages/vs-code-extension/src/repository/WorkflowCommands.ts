import * as path from 'path';

import {
  WorkflowRepositoryManager,
  WorkflowContent,
  WorkflowSearchOptions,
  WorkflowMetadata,
} from '@extremexp/workflow-repository';
import * as vscode from 'vscode';

import { RepositoryConfigManager } from './RepositoryConfigManager.js';
import { WorkflowBrowserPanel } from './WorkflowBrowserPanel.js';
import { WorkflowRepositoryProvider, WorkflowTreeItem } from './WorkflowRepositoryProvider.js';

interface WorkflowQuickPickItem extends vscode.QuickPickItem {
  workflowId: string;
}

export class WorkflowCommands {
  private browserPanel: WorkflowBrowserPanel | undefined;

  constructor(
    private context: vscode.ExtensionContext,
    private configManager: RepositoryConfigManager,
    private repositoryProvider: WorkflowRepositoryProvider
  ) {}

  registerCommands(): void {
    // Repository management commands
    this.registerCommand('extremexp.workflows.addRepository', this.addRepository.bind(this));
    this.registerCommand('extremexp.workflows.removeRepository', this.removeRepository.bind(this));
    this.registerCommand(
      'extremexp.workflows.setDefaultRepository',
      this.setDefaultRepository.bind(this)
    );
    this.registerCommand(
      'extremexp.workflows.refreshRepositories',
      this.refreshRepositories.bind(this)
    );

    // Workflow browser commands
    this.registerCommand('extremexp.workflows.openBrowser', this.openBrowser.bind(this));

    // Workflow operations
    this.registerCommand('extremexp.workflows.openWorkflow', this.openWorkflow.bind(this));
    this.registerCommand('extremexp.workflows.downloadWorkflow', this.downloadWorkflow.bind(this));
    this.registerCommand('extremexp.workflows.uploadWorkflow', this.uploadWorkflow.bind(this));
    this.registerCommand('extremexp.workflows.deleteWorkflow', this.deleteWorkflow.bind(this));
    this.registerCommand('extremexp.workflows.searchWorkflows', this.searchWorkflows.bind(this));
    this.registerCommand(
      'extremexp.workflows.uploadCurrentFile',
      this.uploadCurrentFile.bind(this)
    );

    // New commands
    this.registerCommand('extremexp.workflows.uploadAttachment', this.uploadAttachment.bind(this));
    this.registerCommand('extremexp.workflows.previewWorkflow', this.previewWorkflow.bind(this));

    // Attachment operations
    this.registerCommand(
      'extremexp.workflows.downloadAttachment',
      this.downloadAttachment.bind(this)
    );
    this.registerCommand('extremexp.workflows.openAttachment', this.openAttachment.bind(this));

    // Tree view commands
    this.registerCommand('extremexp.workflows.tree.refresh', this.refreshRepositories.bind(this));
    this.registerCommand('extremexp.workflows.tree.addRepository', this.addRepository.bind(this));
    this.registerCommand('extremexp.workflows.tree.search', this.searchInTree.bind(this));
    this.registerCommand('extremexp.workflows.retryConnection', this.retryConnection.bind(this));
  }

  private registerCommand(command: string, callback: (...args: any[]) => any): void {
    this.context.subscriptions.push(vscode.commands.registerCommand(command, callback));
  }

  async addRepository(): Promise<void> {
    try {
      const config = await this.configManager.promptForRepositoryConfig();
      if (!config) {
        return;
      }

      // Show progress while validating (especially for remote repositories)
      const errors = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title:
            config.type === 'remote' ? 'Testing server connection...' : 'Validating repository...',
          cancellable: false,
        },
        async () => {
          return await this.configManager.validateRepositoryConfig(config);
        }
      );

      if (errors.length > 0) {
        const errorMessage = `Invalid configuration:\n${errors.map(e => `• ${e}`).join('\n')}`;
        vscode.window.showErrorMessage(errorMessage, { modal: true });
        return;
      }

      await this.configManager.addRepository(config);
      this.repositoryProvider.refresh();

      const action = await vscode.window.showInformationMessage(
        `Repository "${config.name}" added successfully and verified`,
        'Open Browser'
      );

      if (action === 'Open Browser') {
        await this.openBrowser();
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to add repository: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async removeRepository(repositoryNameOrTreeItem?: string | WorkflowTreeItem): Promise<void> {
    try {
      let nameToRemove: string | undefined;

      // Handle the case where this is called from tree view context menu
      if (repositoryNameOrTreeItem && typeof repositoryNameOrTreeItem === 'object') {
        // Extract repository name from tree item - for repository items, the label is the repository name
        nameToRemove = repositoryNameOrTreeItem.label;
      } else if (typeof repositoryNameOrTreeItem === 'string') {
        nameToRemove = repositoryNameOrTreeItem;
      }

      if (!nameToRemove) {
        const repositories = this.configManager.getRepositories();
        if (repositories.length === 0) {
          vscode.window.showInformationMessage('No repositories configured');
          return;
        }
        const selected = await vscode.window.showQuickPick(
          repositories.map(repo => ({
            label: repo.name,
            description: `${repo.type} repository${repo.isDefault ? ' (default)' : ''}`,
            detail: (repo.type === 'local' ? repo.path : repo.url) || '',
            repository: repo,
          })),
          {
            placeHolder: 'Select repository to remove',
            title: 'Remove Repository',
          }
        );

        if (!selected) {
          return;
        }

        nameToRemove = selected.label;
      }

      const confirmed = await vscode.window.showWarningMessage(
        `Are you sure you want to remove repository "${nameToRemove}"?`,
        { modal: true },
        'Remove'
      );

      if (confirmed === 'Remove') {
        await this.configManager.removeRepository(nameToRemove!);
        this.repositoryProvider.refresh();

        vscode.window.showInformationMessage(`Repository "${nameToRemove}" removed successfully`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to remove repository: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async setDefaultRepository(repositoryNameOrTreeItem?: string | WorkflowTreeItem): Promise<void> {
    try {
      let nameToSet: string | undefined;

      // Handle the case where this is called from tree view context menu
      if (repositoryNameOrTreeItem && typeof repositoryNameOrTreeItem === 'object') {
        // Extract repository name from tree item - for repository items, the label is the repository name
        nameToSet = repositoryNameOrTreeItem.label;
      } else if (typeof repositoryNameOrTreeItem === 'string') {
        nameToSet = repositoryNameOrTreeItem;
      }

      if (!nameToSet) {
        const repositories = this.configManager.getRepositories();
        if (repositories.length === 0) {
          vscode.window.showInformationMessage('No repositories configured');
          return;
        }
        const selected = await vscode.window.showQuickPick(
          repositories.map(repo => ({
            label: repo.name,
            description: `${repo.type} repository${repo.isDefault ? ' (current default)' : ''}`,
            detail: (repo.type === 'local' ? repo.path : repo.url) || '',
          })),
          {
            placeHolder: 'Select default repository',
            title: 'Set Default Repository',
          }
        );
        if (!selected) {
          return;
        }

        nameToSet = selected.label;
      }

      if (!nameToSet) {
        return;
      }

      await this.configManager.setDefaultRepository(nameToSet);
      this.repositoryProvider.refresh();

      vscode.window.showInformationMessage(`"${nameToSet}" set as default repository`);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to set default repository: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  refreshRepositories(): void {
    this.repositoryProvider.refresh();
    vscode.window.showInformationMessage('Repositories refreshed');
  }

  async openBrowser(): Promise<void> {
    try {
      if (!this.browserPanel || this.browserPanel.isDisposed()) {
        this.browserPanel = new WorkflowBrowserPanel(
          this.context,
          this.repositoryProvider.getRepositoryManager(),
          this.configManager
        );
      }

      await this.browserPanel.show();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to open workflow browser: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async openWorkflow(
    repositoryNameOrItem?: string | WorkflowTreeItem,
    workflowId?: string
  ): Promise<void> {
    try {
      const { repoName, id } = await this.resolveWorkflowParams(repositoryNameOrItem, workflowId);
      if (!repoName || !id) {
        return;
      }

      const repositoryManager = this.repositoryProvider.getRepositoryManager();
      const workflow = await repositoryManager.getWorkflow(id, repoName);

      if (!workflow) {
        vscode.window.showErrorMessage('Workflow not found');
        return;
      }

      // Check if a document with this workflow is already open
      const workflowFileName = `${workflow.metadata.name}_${id}`;
      const fileExtension = path.extname(workflow.metadata.mainFile) || '.xxp';
      const tempUri = vscode.Uri.parse(`untitled:${workflowFileName}${fileExtension}`);

      // Find if document is already open
      const existingDoc = vscode.workspace.textDocuments.find(
        doc => doc.uri.scheme === 'untitled' && doc.uri.path.includes(workflowFileName)
      );

      if (existingDoc) {
        // If already open, just show the existing document
        await vscode.window.showTextDocument(existingDoc);
        return;
      }

      // Create a new document with the workflow content
      const document = await vscode.workspace.openTextDocument(tempUri);
      const editor = await vscode.window.showTextDocument(document);

      // Replace all content instead of inserting to avoid duplication
      await editor.edit(editBuilder => {
        const entireRange = new vscode.Range(
          new vscode.Position(0, 0),
          new vscode.Position(document.lineCount, 0)
        );
        editBuilder.replace(entireRange, workflow.mainFileContent);
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to open workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async downloadWorkflow(
    repositoryNameOrItem?: string | WorkflowTreeItem,
    workflowId?: string
  ): Promise<void> {
    try {
      const { repoName, id } = await this.resolveWorkflowParams(repositoryNameOrItem, workflowId);
      if (!repoName || !id) {
        return;
      }

      const repositoryManager = this.repositoryProvider.getRepositoryManager();
      const workflow = await repositoryManager.getWorkflow(id, repoName);

      if (!workflow) {
        vscode.window.showErrorMessage('Workflow not found');
        return;
      }

      const targetFolder = await this.selectTargetFolder();
      if (!targetFolder) {
        return;
      }

      // Pass repository name separately to download function
      await this.downloadWorkflowToFolder(workflow, targetFolder, repositoryManager, repoName);

      const action = await vscode.window.showInformationMessage(
        `Workflow "${workflow.metadata.name}" downloaded successfully`,
        'Open Folder',
        'Open in VS Code'
      );

      if (action === 'Open Folder') {
        vscode.commands.executeCommand('revealFileInOS', targetFolder);
      } else if (action === 'Open in VS Code') {
        const workflowName = workflow.metadata.name.replace(/[^a-zA-Z0-9-_]/g, '-');
        const workflowDir = vscode.Uri.joinPath(targetFolder, workflowName);
        vscode.commands.executeCommand('vscode.openFolder', workflowDir, { forceNewWindow: false });
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async uploadWorkflow(repositoryName?: string): Promise<void> {
    try {
      const repoName = repositoryName || (await this.selectRepository());
      if (!repoName) {
        return;
      }

      const uploadType = await vscode.window.showQuickPick(
        [
          {
            label: '📁 Upload Workflow Folder',
            description: 'Upload a complete workflow folder with workflow.json',
            value: 'folder',
          },
          {
            label: '📄 Upload Single File',
            description: 'Upload a single .xxp or .espace file as workflow',
            value: 'file',
          },
        ],
        {
          placeHolder: 'How would you like to upload the workflow?',
          title: 'Upload Workflow',
        }
      );

      if (!uploadType) {
        return;
      }

      if (uploadType.value === 'folder') {
        await this.uploadWorkflowFolder(repoName);
      } else {
        await this.uploadWorkflowFile(repoName);
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async uploadAttachment(repositoryName?: string, workflowId?: string): Promise<void> {
    try {
      const { repoName, id } = await this.resolveWorkflowParams(repositoryName, workflowId);
      if (!repoName || !id) {
        return;
      }

      // Select files to attach
      const fileUris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectMany: true,
        openLabel: 'Select Attachments',
        filters: {
          'Python Files': ['py'],
          'JavaScript Files': ['js', 'ts'],
          'Data Files': ['json', 'csv', 'txt', 'xml', 'yaml', 'yml'],
          'All Files': ['*'],
        },
      });

      if (!fileUris || fileUris.length === 0) {
        return;
      }

      // Get existing workflow
      const repositoryManager = this.repositoryProvider.getRepositoryManager();
      const workflow = await repositoryManager.getWorkflow(id, repoName);

      if (!workflow) {
        vscode.window.showErrorMessage('Workflow not found');
        return;
      }

      // Get repository
      const repository = repositoryManager.getRepository(repoName);
      if (!repository) {
        vscode.window.showErrorMessage('Repository not found');
        return;
      }

      // Get existing content
      const content = await repository.getContent(id);
      if (!content) {
        vscode.window.showErrorMessage('Failed to get workflow content');
        return;
      }

      // Create mutable attachments map
      const newAttachments = new Map<string, Buffer>();

      // Copy existing attachments
      for (const [name, buffer] of content.attachments) {
        newAttachments.set(name, buffer);
      }

      // Add new attachments
      let overwriteCount = 0;
      for (const uri of fileUris) {
        const fileName = path.basename(uri.fsPath);

        // Check if file already exists
        if (newAttachments.has(fileName)) {
          const action = await vscode.window.showWarningMessage(
            `File "${fileName}" already exists. Overwrite?`,
            'Yes',
            'Skip',
            'Cancel All'
          );

          if (action === 'Cancel All') {
            return;
          } else if (action === 'Skip') {
            continue;
          }
          overwriteCount++;
        }

        const fileData = await vscode.workspace.fs.readFile(uri);
        newAttachments.set(fileName, Buffer.from(fileData));
      }

      // Update workflow
      await repositoryManager.updateWorkflow(
        id,
        {
          mainFile: content.mainFile,
          attachments: newAttachments,
        },
        {},
        repoName
      );

      const message =
        overwriteCount > 0
          ? `Added ${fileUris.length} attachment(s) to workflow "${workflow.metadata.name}" (${overwriteCount} overwritten)`
          : `Added ${fileUris.length} attachment(s) to workflow "${workflow.metadata.name}"`;

      vscode.window.showInformationMessage(message);

      this.repositoryProvider.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to upload attachments: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async previewWorkflow(
    repositoryNameOrItem?: string | WorkflowTreeItem,
    workflowId?: string
  ): Promise<void> {
    try {
      const { repoName, id } = await this.resolveWorkflowParams(repositoryNameOrItem, workflowId);
      if (!repoName || !id) return;

      const repositoryManager = this.repositoryProvider.getRepositoryManager();
      const workflow = await repositoryManager.getWorkflow(id, repoName);
      if (!workflow) {
        vscode.window.showErrorMessage('Workflow not found');
        return;
      }

      // Create preview panel
      const panel = vscode.window.createWebviewPanel(
        'workflowPreview',
        `Preview: ${workflow.metadata.name}`,
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
        }
      );

      panel.webview.html = this.getPreviewHtml(workflow);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to preview workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async searchInTree(): Promise<void> {
    const searchQuery = await vscode.window.showInputBox({
      prompt: 'Enter search terms',
      placeHolder: 'Search workflows by name, description, or tags...',
    });

    if (searchQuery === undefined) {
      return;
    }

    if (searchQuery === '') {
      this.repositoryProvider.setSearchFilter('');
      return;
    }

    this.repositoryProvider.setSearchFilter(searchQuery);
    vscode.window.showInformationMessage(`Searching for: ${searchQuery}`);
  }

  private async uploadWorkflowFolder(repositoryName: string): Promise<void> {
    const workflowFolder = await this.selectWorkflowFolder();
    if (!workflowFolder) {
      return;
    }

    const repositoryManager = this.repositoryProvider.getRepositoryManager();
    let content = await this.readWorkflowFromFolder(workflowFolder);

    if (!content) {
      // No workflow.json found - create it with wizard
      const createManifest = await vscode.window.showQuickPick(
        [
          { label: 'Yes', description: 'Create workflow.json with wizard' },
          { label: 'No', description: 'Cancel upload' },
        ],
        {
          placeHolder: 'No workflow.json found. Would you like to create one?',
        }
      );

      if (createManifest?.label !== 'Yes') {
        return;
      }

      // Find main file
      const files = await vscode.workspace.fs.readDirectory(workflowFolder);
      const workflowFiles = files
        .filter(
          ([name, type]) =>
            type === vscode.FileType.File && (name.endsWith('.xxp') || name.endsWith('.espace'))
        )
        .map(([name]) => name);

      if (workflowFiles.length === 0) {
        vscode.window.showErrorMessage('No .xxp or .espace files found in the folder');
        return;
      }

      let mainFile: string;
      if (workflowFiles.length === 1) {
        mainFile = workflowFiles[0]!;
        vscode.window.showInformationMessage(`Using ${mainFile} as main workflow file`);
      } else {
        const selected = await vscode.window.showQuickPick(workflowFiles, {
          placeHolder: 'Select the main workflow file',
        });
        if (!selected) return;
        mainFile = selected;
      }

      // Get metadata
      const metadata = await this.promptForWorkflowMetadata(mainFile);
      if (!metadata) return;

      // Create workflow.json
      const manifest = {
        ...metadata,
        mainFile,
      };

      const manifestUri = vscode.Uri.joinPath(workflowFolder, 'workflow.json');
      await vscode.workspace.fs.writeFile(
        manifestUri,
        Buffer.from(JSON.stringify(manifest, null, 2), 'utf8')
      );

      vscode.window.showInformationMessage('Created workflow.json');

      // Re-read the folder
      content = await this.readWorkflowFromFolder(workflowFolder);
      if (!content) {
        vscode.window.showErrorMessage('Failed to read workflow after creating manifest');
        return;
      }
    }

    const targetPath = await this.promptForTargetPath();
    if (targetPath === undefined) {
      return;
    }

    const metadata = await repositoryManager.uploadWorkflow(
      targetPath,
      content.content,
      content.metadata,
      repositoryName
    );

    this.repositoryProvider.refresh();
    vscode.window.showInformationMessage(`Workflow "${metadata.name}" uploaded successfully`);
  }

  private async uploadWorkflowFile(repositoryName: string): Promise<void> {
    const fileUri = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        'Workflow Files': ['xxp', 'espace'],
        'All Files': ['*'],
      },
      openLabel: 'Select Workflow File',
    });
    if (!fileUri || fileUri.length === 0 || !fileUri[0]) {
      return;
    }

    const fileName = path.basename(fileUri[0].fsPath);
    const fileExtension = path.extname(fileName);

    if (!['.xxp', '.espace'].includes(fileExtension)) {
      vscode.window.showErrorMessage('Only .xxp and .espace files can be uploaded as workflows');
      return;
    }

    const fileContent = await vscode.workspace.fs.readFile(fileUri[0]);
    const metadata = await this.promptForWorkflowMetadata(fileName);
    if (!metadata) {
      return;
    }

    const targetPath = await this.promptForTargetPath();
    if (targetPath === undefined) {
      return;
    }

    const content: WorkflowContent = {
      mainFile: Buffer.from(fileContent).toString('utf8'),
      attachments: new Map(),
    };

    const repositoryManager = this.repositoryProvider.getRepositoryManager();
    const uploadedMetadata = await repositoryManager.uploadWorkflow(
      targetPath,
      content,
      {
        ...metadata,
        mainFile: fileName,
        path: targetPath,
      },
      repositoryName
    );

    this.repositoryProvider.refresh();
    vscode.window.showInformationMessage(
      `Workflow "${uploadedMetadata.name}" uploaded successfully`
    );
  }

  async deleteWorkflow(
    repositoryNameOrItem?: string | WorkflowTreeItem,
    workflowId?: string
  ): Promise<void> {
    try {
      const { repoName, id } = await this.resolveWorkflowParams(repositoryNameOrItem, workflowId);
      if (!repoName || !id) {
        return;
      }

      const repositoryManager = this.repositoryProvider.getRepositoryManager();
      const workflow = await repositoryManager.getWorkflow(id, repoName);

      if (!workflow) {
        vscode.window.showErrorMessage('Workflow not found');
        return;
      }

      const confirmed = await vscode.window.showWarningMessage(
        `Are you sure you want to delete workflow "${workflow.metadata.name}"?`,
        { modal: true },
        'Delete'
      );

      if (confirmed === 'Delete') {
        const success = await repositoryManager.deleteWorkflow(id, repoName);

        if (success) {
          this.repositoryProvider.refresh();
          vscode.window.showInformationMessage(
            `Workflow "${workflow.metadata.name}" deleted successfully`
          );
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

  async searchWorkflows(): Promise<void> {
    try {
      const repositoryName = await this.selectRepository();
      if (!repositoryName) {
        return;
      }

      const query = await vscode.window.showInputBox({
        prompt: 'Enter search query (leave empty to show all workflows)',
        placeHolder: 'Search workflows by name or description...',
      });

      if (query === undefined) {
        return;
      }

      const repositoryManager = this.repositoryProvider.getRepositoryManager();
      const searchOptions: WorkflowSearchOptions = query ? { query } : {};

      const workflows = await repositoryManager.searchWorkflows(searchOptions, repositoryName);

      if (workflows.length === 0) {
        vscode.window.showInformationMessage('No workflows found');
        return;
      }
      const selected = await vscode.window.showQuickPick<WorkflowQuickPickItem>(
        workflows.map((workflow: WorkflowMetadata) => ({
          label: workflow.name,
          description: `by ${workflow.author}`,
          detail: workflow.description,
          workflowId: workflow.id,
        })),
        {
          placeHolder: 'Select workflow to open',
          title: `Found ${workflows.length} workflow${workflows.length === 1 ? '' : 's'}`,
        }
      );

      if (selected) {
        await this.openWorkflow(repositoryName, selected.workflowId);
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async uploadCurrentFile(): Promise<void> {
    try {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        vscode.window.showErrorMessage('No active file to upload');
        return;
      }

      const document = activeEditor.document;
      if (document.isUntitled) {
        vscode.window.showErrorMessage('Please save the file before uploading');
        return;
      }

      const fileName = path.basename(document.fileName);
      const fileExtension = path.extname(fileName);

      if (!['.xxp', '.espace'].includes(fileExtension)) {
        vscode.window.showErrorMessage('Only .xxp and .espace files can be uploaded as workflows');
        return;
      }

      const repositoryName = await this.selectRepository();
      if (!repositoryName) {
        return;
      }

      const metadata = await this.promptForWorkflowMetadata(fileName);
      if (!metadata) {
        return;
      }

      const targetPath = await this.promptForTargetPath();
      if (targetPath === undefined) {
        return;
      }

      const content: WorkflowContent = {
        mainFile: document.getText(),
        attachments: new Map(),
      };

      const repositoryManager = this.repositoryProvider.getRepositoryManager();
      const uploadedMetadata = await repositoryManager.uploadWorkflow(
        targetPath,
        content,
        {
          ...metadata,
          mainFile: fileName,
          path: targetPath,
        },
        repositoryName
      );

      this.repositoryProvider.refresh();
      vscode.window.showInformationMessage(
        `Workflow "${uploadedMetadata.name}" uploaded successfully`
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async retryConnection(repositoryName: string): Promise<void> {
    try {
      this.repositoryProvider.refresh();

      // Wait a moment for the refresh to complete, then check if the issue is resolved
      setTimeout(async () => {
        const repo = this.configManager.getRepository(repositoryName);
        if (repo?.type === 'remote') {
          const statusCheckResult = await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Testing connection to ${repo.name}...`,
              cancellable: false,
            },
            async () => {
              try {
                const errors = await this.configManager.validateRepositoryConfig(repo);
                return errors;
              } catch (error) {
                return [error instanceof Error ? error.message : 'Unknown error'];
              }
            }
          );

          if (statusCheckResult.length === 0) {
            vscode.window.showInformationMessage(
              `Connection to ${repositoryName} restored successfully!`
            );
          } else {
            vscode.window
              .showWarningMessage(
                `Still unable to connect to ${repositoryName}: ${statusCheckResult[0]}`,
                'Edit Repository'
              )
              .then(action => {
                if (action === 'Edit Repository') {
                  vscode.commands.executeCommand(
                    'extremexp.workflows.editRepository',
                    repositoryName
                  );
                }
              });
          }
        }
      }, 1000);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to retry connection: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async resolveWorkflowParams(
    repositoryNameOrItem?: string | WorkflowTreeItem,
    workflowId?: string
  ): Promise<{ repoName?: string; id?: string }> {
    let repoName: string | undefined;
    let id: string | undefined;

    // Check if the first parameter is a WorkflowTreeItem (from context menu)
    if (
      repositoryNameOrItem &&
      typeof repositoryNameOrItem === 'object' &&
      'context' in repositoryNameOrItem
    ) {
      const treeItem = repositoryNameOrItem as WorkflowTreeItem;
      repoName = treeItem.context?.repository;
      id = treeItem.context?.workflowId;
    } else {
      repoName = repositoryNameOrItem as string;
      id = workflowId;
    }

    if (!repoName) {
      repoName = await this.selectRepository();
    }

    if (!id && repoName) {
      const repositoryManager = this.repositoryProvider.getRepositoryManager();
      const workflows = await repositoryManager.listWorkflows(repoName);

      if (workflows.length === 0) {
        vscode.window.showInformationMessage('No workflows found in repository');
        return {};
      }
      const selected = await vscode.window.showQuickPick<WorkflowQuickPickItem>(
        workflows.map((workflow: WorkflowMetadata) => ({
          label: workflow.name,
          description: `by ${workflow.author}`,
          detail: workflow.description,
          workflowId: workflow.id,
        })),
        {
          placeHolder: 'Select workflow',
          title: `Select from ${workflows.length} workflow${workflows.length === 1 ? '' : 's'}`,
        }
      );

      id = selected?.workflowId;
    }
    const result: { repoName?: string; id?: string } = {};
    if (repoName) result.repoName = repoName;
    if (id) result.id = id;
    return result;
  }

  private async selectRepository(): Promise<string | undefined> {
    const repositories = this.configManager.getRepositories();

    if (repositories.length === 0) {
      const action = await vscode.window.showErrorMessage(
        'No repositories configured. Please add a repository first.',
        'Add Repository'
      );

      if (action === 'Add Repository') {
        await this.addRepository();
      }
      return undefined;
    }
    if (repositories.length === 1 && repositories[0]) {
      return repositories[0].name;
    }

    const selected = await vscode.window.showQuickPick(
      repositories.map(repo => ({
        label: repo.name,
        description: `${repo.type} repository${repo.isDefault ? ' (default)' : ''}`,
        detail: repo.type === 'local' ? `📁 ${repo.path}` : `🌐 ${repo.url}`,
      })),
      {
        placeHolder: 'Select repository',
        title: 'Choose Repository',
      }
    );

    return selected?.label;
  }

  private async selectTargetFolder(): Promise<vscode.Uri | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
      const selectedFolder = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Target Folder',
        title: 'Select Download Location',
      });
      return selectedFolder?.[0];
    } else if (workspaceFolders.length === 1 && workspaceFolders[0]) {
      return workspaceFolders[0].uri;
    } else {
      const selected = await vscode.window.showWorkspaceFolderPick({
        placeHolder: 'Select workspace folder for download',
      });
      return selected?.uri;
    }
  }

  private async selectWorkflowFolder(): Promise<vscode.Uri | undefined> {
    const selectedFolder = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: 'Select Workflow Folder',
      title: 'Select Workflow Folder (can contain workflow.json)',
    });

    return selectedFolder?.[0];
  }

  private async downloadWorkflowToFolder(
    workflow: any,
    targetFolder: vscode.Uri,
    repositoryManager: WorkflowRepositoryManager,
    repositoryName: string
  ): Promise<void> {
    const workflowName = workflow.metadata.name.replace(/[^a-zA-Z0-9-_]/g, '-');
    const workflowDir = vscode.Uri.joinPath(targetFolder, workflowName);

    await vscode.workspace.fs.createDirectory(workflowDir);

    // Write main file
    const mainFileUri = vscode.Uri.joinPath(workflowDir, workflow.metadata.mainFile);
    await vscode.workspace.fs.writeFile(mainFileUri, Buffer.from(workflow.mainFileContent, 'utf8'));

    // Write attachments - use the provided repository name
    const repository = repositoryManager.getRepository(repositoryName);
    if (repository) {
      const content = await repository.getContent(workflow.metadata.id);
      if (content && content.attachments) {
        for (const [fileName, fileData] of content.attachments) {
          const attachmentUri = vscode.Uri.joinPath(workflowDir, fileName);
          await vscode.workspace.fs.writeFile(attachmentUri, fileData);
        }
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

  private async readWorkflowFromFolder(
    workflowFolder: vscode.Uri
  ): Promise<{ content: WorkflowContent; metadata: any } | null> {
    try {
      const manifestUri = vscode.Uri.joinPath(workflowFolder, 'workflow.json');
      const manifestData = await vscode.workspace.fs.readFile(manifestUri);
      const manifest = JSON.parse(Buffer.from(manifestData).toString('utf8'));

      const mainFileUri = vscode.Uri.joinPath(workflowFolder, manifest.mainFile);
      const mainFileData = await vscode.workspace.fs.readFile(mainFileUri);
      const mainFileContent = Buffer.from(mainFileData).toString('utf8');

      const attachments = new Map<string, Buffer>();
      const files = await vscode.workspace.fs.readDirectory(workflowFolder);

      for (const [fileName, fileType] of files) {
        if (
          fileType === vscode.FileType.File &&
          fileName !== manifest.mainFile &&
          fileName !== 'workflow.json'
        ) {
          const fileUri = vscode.Uri.joinPath(workflowFolder, fileName);
          const fileData = await vscode.workspace.fs.readFile(fileUri);
          attachments.set(fileName, Buffer.from(fileData));
        }
      }

      return {
        content: {
          mainFile: mainFileContent,
          attachments,
        },
        metadata: manifest,
      };
    } catch {
      return null;
    }
  }

  private async promptForTargetPath(): Promise<string | undefined> {
    return await vscode.window.showInputBox({
      prompt: 'Enter target path in repository (leave empty for root)',
      placeHolder: 'category/subcategory or leave empty',
      value: '',
    });
  }

  private async promptForWorkflowMetadata(fileName: string): Promise<any | undefined> {
    const baseName = path.basename(fileName, path.extname(fileName));

    const name = await vscode.window.showInputBox({
      prompt: 'Enter workflow name',
      placeHolder: 'My Workflow',
      value: baseName,
      validateInput: value => {
        if (!value.trim()) {
          return 'Workflow name is required';
        }
        return null;
      },
    });

    if (!name) return undefined;

    const description = await vscode.window.showInputBox({
      prompt: 'Enter workflow description',
      placeHolder: 'A brief description of the workflow',
      validateInput: value => {
        if (!value || !value.trim()) {
          return 'Description is required';
        }
        return null;
      },
    });

    if (description === undefined) return undefined;

    const defaultAuthor = this.configManager.getDefaultAuthor();
    const author = await vscode.window.showInputBox({
      prompt: 'Enter author name',
      placeHolder: 'Your Name',
      value: defaultAuthor,
      validateInput: value => {
        if (!value || !value.trim()) {
          return 'Author is required';
        }
        return null;
      },
    });

    if (!author) return undefined;

    // Store as default if no default was set
    if (!defaultAuthor && author.trim()) {
      await this.configManager.setDefaultAuthor(author.trim());
    }

    const tagsInput = await vscode.window.showInputBox({
      prompt: 'Enter tags (comma separated, optional)',
      placeHolder: 'data-processing, machine-learning, etc.',
    });

    const tags = tagsInput
      ? tagsInput
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag)
      : [];

    return {
      name: name.trim(),
      description: description.trim(),
      author: author.trim(),
      tags,
    };
  }

  private getPreviewHtml(workflow: any): string {
    const escapeHtml = (text: string) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workflow Preview</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
            line-height: 1.6;
        }
        
        .workflow-header {
            border-bottom: 2px solid var(--vscode-panel-border);
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        
        h1 {
            margin: 0 0 10px 0;
            color: var(--vscode-foreground);
        }
        
        .metadata {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 10px 20px;
            margin: 20px 0;
        }
        
        .metadata-label {
            font-weight: bold;
            color: var(--vscode-descriptionForeground);
        }
        
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }
        
        .tag {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
        }
        
        .section {
            margin: 30px 0;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: var(--vscode-foreground);
        }
        
        .code-preview {
            background-color: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
        }
        
        .attachments-list {
            list-style: none;
            padding: 0;
        }
        
        .attachment-item {
            display: flex;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .attachment-icon {
            margin-right: 10px;
        }
        
        .attachment-name {
            flex: 1;
        }
        
        .attachment-size {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }
        
        .no-attachments {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="workflow-header">
        <h1>${escapeHtml(workflow.metadata.name)}</h1>
        <p>${escapeHtml(workflow.metadata.description)}</p>
    </div>
    
    <div class="metadata">
        <span class="metadata-label">Author:</span>
        <span>${escapeHtml(workflow.metadata.author)}</span>
        
        <span class="metadata-label">Main File:</span>
        <span>${escapeHtml(workflow.metadata.mainFile)}</span>
        
        <span class="metadata-label">Created:</span>
        <span>${new Date(workflow.metadata.createdAt).toLocaleString()}</span>
        
        <span class="metadata-label">Modified:</span>
        <span>${new Date(workflow.metadata.modifiedAt).toLocaleString()}</span>
    </div>
    
    <div class="section">
        <div class="section-title">Tags</div>
        <div class="tags">
            ${workflow.metadata.tags
              .map((tag: string) => `<span class="tag">${escapeHtml(tag)}</span>`)
              .join('')}
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">Main File Preview</div>
        <div class="code-preview">
            <pre>${escapeHtml(workflow.mainFileContent.substring(0, 1000))}${
              workflow.mainFileContent.length > 1000 ? '\n\n... (truncated)' : ''
            }</pre>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">Attachments</div>
        ${
          workflow.attachments.length > 0
            ? `
            <ul class="attachments-list">
                ${workflow.attachments
                  .map(
                    (attachment: any) => `
                    <li class="attachment-item">
                        <span class="attachment-icon">📄</span>
                        <span class="attachment-name">${escapeHtml(attachment.name)}</span>
                        <span class="attachment-size">${this.formatFileSize(attachment.size)}</span>
                    </li>
                `
                  )
                  .join('')}
            </ul>
        `
            : '<p class="no-attachments">No attachments</p>'
        }
    </div>
</body>
</html>`;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async downloadAttachment(item: WorkflowTreeItem): Promise<void> {
    try {
      if (
        item.type !== 'attachment' ||
        !item.context?.repository ||
        !item.context?.workflowId ||
        !item.context?.attachmentName
      ) {
        vscode.window.showErrorMessage('Invalid attachment selection');
        return;
      }

      const targetFolder = await this.selectTargetFolder();
      if (!targetFolder) {
        return;
      }

      const repositoryManager = this.repositoryProvider.getRepositoryManager();
      const repository = repositoryManager.getRepository(item.context.repository);
      if (!repository) {
        vscode.window.showErrorMessage('Repository not found');
        return;
      }

      const content = await repository.getContent(item.context.workflowId);
      if (!content || !content.attachments.has(item.context.attachmentName)) {
        vscode.window.showErrorMessage('Attachment not found');
        return;
      }

      const attachmentData = content.attachments.get(item.context.attachmentName)!;
      const attachmentUri = vscode.Uri.joinPath(targetFolder, item.context.attachmentName);
      await vscode.workspace.fs.writeFile(attachmentUri, attachmentData);

      const action = await vscode.window.showInformationMessage(
        `Attachment "${item.context.attachmentName}" downloaded successfully`,
        'Open Folder',
        'Open File'
      );

      if (action === 'Open Folder') {
        vscode.commands.executeCommand('revealFileInOS', targetFolder);
      } else if (action === 'Open File') {
        vscode.commands.executeCommand('vscode.open', attachmentUri);
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to download attachment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async openAttachment(item: WorkflowTreeItem): Promise<void> {
    try {
      if (
        item.type !== 'attachment' ||
        !item.context?.repository ||
        !item.context?.workflowId ||
        !item.context?.attachmentName
      ) {
        vscode.window.showErrorMessage('Invalid attachment selection');
        return;
      }

      const repositoryManager = this.repositoryProvider.getRepositoryManager();
      const repository = repositoryManager.getRepository(item.context.repository);
      if (!repository) {
        vscode.window.showErrorMessage('Repository not found');
        return;
      }

      const content = await repository.getContent(item.context.workflowId);
      if (!content || !content.attachments.has(item.context.attachmentName)) {
        vscode.window.showErrorMessage('Attachment not found');
        return;
      }

      const attachmentData = content.attachments.get(item.context.attachmentName)!;
      const attachmentName = item.context.attachmentName;

      // Create a temporary file URI for the attachment
      const tempUri = vscode.Uri.parse(`untitled:${attachmentName}`);
      const document = await vscode.workspace.openTextDocument(tempUri);
      const editor = await vscode.window.showTextDocument(document);

      // For text files, show the content; for binary files, show info
      const mimeType = item.context.attachmentMimeType || '';
      if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml')) {
        const textContent = Buffer.from(attachmentData).toString('utf8');
        await editor.edit(editBuilder => {
          const entireRange = new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(document.lineCount, 0)
          );
          editBuilder.replace(entireRange, textContent);
        });
      } else {
        const info = `Binary file: ${attachmentName}\nSize: ${attachmentData.length} bytes\nMIME Type: ${mimeType}\n\n[This is a binary file and cannot be displayed as text]`;
        await editor.edit(editBuilder => {
          const entireRange = new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(document.lineCount, 0)
          );
          editBuilder.replace(entireRange, info);
        });
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to open attachment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
