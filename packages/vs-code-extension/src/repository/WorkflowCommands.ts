import * as vscode from 'vscode';
import * as path from 'path';
import {
  WorkflowRepositoryManager,
  WorkflowContent,
  WorkflowSearchOptions,
  WorkflowMetadata,
} from '@extremexp/workflow-repository';
import { RepositoryConfigManager } from './RepositoryConfigManager.js';
import { WorkflowRepositoryProvider } from './WorkflowRepositoryProvider.js';
import { WorkflowBrowserPanel } from './WorkflowBrowserPanel.js';

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

    // Tree view commands
    this.registerCommand('extremexp.workflows.tree.refresh', this.refreshRepositories.bind(this));
    this.registerCommand('extremexp.workflows.tree.addRepository', this.addRepository.bind(this));
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

      const errors = await this.configManager.validateRepositoryConfig(config);
      if (errors.length > 0) {
        vscode.window.showErrorMessage(`Invalid configuration: ${errors.join(', ')}`);
        return;
      }

      await this.configManager.addRepository(config);
      this.repositoryProvider.refresh();

      const action = await vscode.window.showInformationMessage(
        `Repository "${config.name}" added successfully`,
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

  async removeRepository(repositoryName?: string): Promise<void> {
    try {
      let nameToRemove = repositoryName;

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
        await this.configManager.removeRepository(nameToRemove);
        this.repositoryProvider.refresh();

        vscode.window.showInformationMessage(`Repository "${nameToRemove}" removed successfully`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to remove repository: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async setDefaultRepository(repositoryName?: string): Promise<void> {
    try {
      let nameToSet = repositoryName;

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

  async openWorkflow(repositoryName?: string, workflowId?: string): Promise<void> {
    try {
      const { repoName, id } = await this.resolveWorkflowParams(repositoryName, workflowId);
      if (!repoName || !id) {
        return;
      }

      const repositoryManager = this.repositoryProvider.getRepositoryManager();
      const workflow = await repositoryManager.getWorkflow(id, repoName);

      if (!workflow) {
        vscode.window.showErrorMessage('Workflow not found');
        return;
      }

      // Create a temporary file with the workflow content
      const fileExtension = path.extname(workflow.metadata.mainFile) || '.xxp';
      const tempUri = vscode.Uri.parse(`untitled:${workflow.metadata.name}${fileExtension}`);
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

  async downloadWorkflow(repositoryName?: string, workflowId?: string): Promise<void> {
    try {
      const { repoName, id } = await this.resolveWorkflowParams(repositoryName, workflowId);
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

      await this.downloadWorkflowToFolder(workflow, targetFolder, repositoryManager);

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

  private async uploadWorkflowFolder(repositoryName: string): Promise<void> {
    const workflowFolder = await this.selectWorkflowFolder();
    if (!workflowFolder) {
      return;
    }

    const repositoryManager = this.repositoryProvider.getRepositoryManager();
    const content = await this.readWorkflowFromFolder(workflowFolder);

    if (!content) {
      vscode.window.showErrorMessage(
        'Invalid workflow folder - workflow.json not found or invalid'
      );
      return;
    }

    const targetPath = await this.promptForTargetPath();
    if (targetPath === undefined) {
      return;
    }

    // Check if workflow already exists and prompt for confirmation
    const workflowExists = await repositoryManager.checkWorkflowExists(
      targetPath,
      content.metadata,
      repositoryName
    );

    if (workflowExists) {
      const confirmed = await vscode.window.showWarningMessage(
        `A workflow named "${content.metadata.name}" already exists at path "${targetPath}". Do you want to override it?`,
        { modal: true },
        'Override',
        'Cancel'
      );

      if (confirmed !== 'Override') {
        return;
      }
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

    // Check if workflow already exists and prompt for confirmation
    const workflowMetadata = {
      ...metadata,
      mainFile: fileName,
      path: targetPath,
    };

    const workflowExists = await repositoryManager.checkWorkflowExists(
      targetPath,
      workflowMetadata,
      repositoryName
    );

    if (workflowExists) {
      const confirmed = await vscode.window.showWarningMessage(
        `A workflow named "${metadata.name}" already exists at path "${targetPath}". Do you want to override it?`,
        { modal: true },
        'Override',
        'Cancel'
      );

      if (confirmed !== 'Override') {
        return;
      }
    }

    const uploadedMetadata = await repositoryManager.uploadWorkflow(
      targetPath,
      content,
      workflowMetadata,
      repositoryName
    );

    this.repositoryProvider.refresh();
    vscode.window.showInformationMessage(
      `Workflow "${uploadedMetadata.name}" uploaded successfully`
    );
  }

  async deleteWorkflow(repositoryName?: string, workflowId?: string): Promise<void> {
    try {
      const { repoName, id } = await this.resolveWorkflowParams(repositoryName, workflowId);
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
          description: `by ${workflow.author} • v${workflow.version}`,
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

      // Check if workflow already exists and prompt for confirmation
      const workflowMetadata = {
        ...metadata,
        mainFile: fileName,
        path: targetPath,
      };

      const workflowExists = await repositoryManager.checkWorkflowExists(
        targetPath,
        workflowMetadata,
        repositoryName
      );

      if (workflowExists) {
        const confirmed = await vscode.window.showWarningMessage(
          `A workflow named "${metadata.name}" already exists at path "${targetPath}". Do you want to override it?`,
          { modal: true },
          'Override',
          'Cancel'
        );

        if (confirmed !== 'Override') {
          return;
        }
      }

      const uploadedMetadata = await repositoryManager.uploadWorkflow(
        targetPath,
        content,
        workflowMetadata,
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

  private async resolveWorkflowParams(
    repositoryName?: string,
    workflowId?: string
  ): Promise<{ repoName?: string; id?: string }> {
    let repoName = repositoryName;
    let id = workflowId;

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
          description: `by ${workflow.author} • v${workflow.version}`,
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
      title: 'Select Workflow Folder (must contain workflow.json)',
    });

    return selectedFolder?.[0];
  }

  private async downloadWorkflowToFolder(
    workflow: any,
    targetFolder: vscode.Uri,
    repositoryManager: WorkflowRepositoryManager
  ): Promise<void> {
    const workflowName = workflow.metadata.name.replace(/[^a-zA-Z0-9-_]/g, '-');
    const workflowDir = vscode.Uri.joinPath(targetFolder, workflowName);

    await vscode.workspace.fs.createDirectory(workflowDir);

    // Write main file
    const mainFileUri = vscode.Uri.joinPath(workflowDir, workflow.metadata.mainFile);
    await vscode.workspace.fs.writeFile(mainFileUri, Buffer.from(workflow.mainFileContent, 'utf8'));

    // Write attachments
    const content = await repositoryManager.getRepository()?.getContent(workflow.metadata.id);
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
      version: workflow.metadata.version,
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

    const author = await vscode.window.showInputBox({
      prompt: 'Enter author name',
      placeHolder: 'Your Name',
      validateInput: value => {
        if (!value || !value.trim()) {
          return 'Author is required';
        }
        return null;
      },
    });

    if (!author) return undefined;

    const version = await vscode.window.showInputBox({
      prompt: 'Enter version',
      placeHolder: '1.0.0',
      value: '1.0.0',
      validateInput: value => {
        if (!value || !value.trim()) {
          return 'Version is required';
        }
        return null;
      },
    });

    if (!version) return undefined;

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
      version: version.trim(),
      tags,
    };
  }
}
