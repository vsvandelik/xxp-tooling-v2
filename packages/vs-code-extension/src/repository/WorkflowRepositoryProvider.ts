import {
  WorkflowRepositoryManager,
  WorkflowTreeNode,
  WorkflowMetadata,
  RepositoryConfig,
  WorkflowAttachment,
} from '@extremexp/workflow-repository';
import * as vscode from 'vscode';

import { RepositoryConfigManager } from './RepositoryConfigManager.js';

export class WorkflowRepositoryProvider implements vscode.TreeDataProvider<WorkflowTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    WorkflowTreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private repositoryManager = new WorkflowRepositoryManager();
  private searchFilter: string = '';

  constructor(private configManager: RepositoryConfigManager) {
    this.initializeRepositories();
    this.configManager.onConfigurationChanged(() => {
      this.initializeRepositories();
      this.refresh();
    });
    // Initialize search context
    vscode.commands.executeCommand('setContext', 'extremexp.workflows.searchActive', false);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  setSearchFilter(filter: string): void {
    this.searchFilter = filter;
    // Set context for VS Code to control button visibility
    vscode.commands.executeCommand('setContext', 'extremexp.workflows.searchActive', filter !== '');
    this.refresh();
  }

  getTreeItem(element: WorkflowTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: WorkflowTreeItem): Promise<WorkflowTreeItem[]> {
    if (!element) {
      return this.getRootItems();
    }

    if (element.type === 'repository') {
      return this.getRepositoryChildren(element);
    }

    if (element.type === 'folder') {
      return this.getFolderChildren(element);
    }

    if (element.type === 'workflow') {
      return this.getWorkflowChildren(element);
    }

    return [];
  }

  private async getRootItems(): Promise<WorkflowTreeItem[]> {
    const repositories = this.configManager.getRepositories();
    const items: WorkflowTreeItem[] = [];

    if (repositories.length === 0) {
      return [
        new WorkflowTreeItem(
          'No repositories configured',
          'message',
          vscode.TreeItemCollapsibleState.None,
          {
            command: {
              command: 'extremexp.workflows.addRepository',
              title: 'Add Repository',
            },
          }
        ),
      ];
    }

    for (const repo of repositories) {
      const status = await this.getRepositoryStatus(repo);
      items.push(
        new WorkflowTreeItem(repo.name, 'repository', vscode.TreeItemCollapsibleState.Collapsed, {
          repository: repo.name,
          repositoryConfig: repo,
          status,
        })
      );
    }

    return items;
  }

  private async getRepositoryChildren(element: WorkflowTreeItem): Promise<WorkflowTreeItem[]> {
    const repositoryName = element.context?.repository;
    if (!repositoryName) {
      return [];
    }

    try {
      const repository = this.repositoryManager.getRepository(repositoryName);
      if (!repository) {
        return [
          new WorkflowTreeItem(
            'Repository not available',
            'error',
            vscode.TreeItemCollapsibleState.None,
            { repository: repositoryName }
          ),
        ];
      }

      const tree = await repository.getTreeStructure();
      let items = this.convertTreeNodesToItems(tree.children || [], repositoryName);

      // Apply search filter if set
      if (this.searchFilter) {
        items = await this.filterItems(items, this.searchFilter);
      }

      // Add search status if filter is active
      if (this.searchFilter && items.length === 0) {
        return [
          new WorkflowTreeItem(
            `No workflows match "${this.searchFilter}"`,
            'message',
            vscode.TreeItemCollapsibleState.None,
            { repository: repositoryName }
          ),
        ];
      }

      return items;
    } catch (error) {
      const errorMessage = this.getRepositoryErrorMessage(error, repositoryName);
      return [
        new WorkflowTreeItem(errorMessage, 'error', vscode.TreeItemCollapsibleState.None, {
          repository: repositoryName,
          command: {
            command: 'extremexp.workflows.retryConnection',
            title: 'Retry Connection',
            arguments: [repositoryName],
          },
        }),
      ];
    }
  }

  private async getFolderChildren(element: WorkflowTreeItem): Promise<WorkflowTreeItem[]> {
    const repositoryName = element.context?.repository;
    const folderPath = element.context?.path;

    if (!repositoryName || !folderPath) {
      return [];
    }

    try {
      const repository = this.repositoryManager.getRepository(repositoryName);
      if (!repository) {
        return [];
      }

      const tree = await repository.getTreeStructure(folderPath);
      let items = this.convertTreeNodesToItems(tree.children || [], repositoryName);

      // Apply search filter if set
      if (this.searchFilter) {
        items = await this.filterItems(items, this.searchFilter);
      }

      return items;
    } catch (error) {
      return [
        new WorkflowTreeItem(
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'error',
          vscode.TreeItemCollapsibleState.None,
          { repository: repositoryName }
        ),
      ];
    }
  }

  private async getWorkflowChildren(element: WorkflowTreeItem): Promise<WorkflowTreeItem[]> {
    const repositoryName = element.context?.repository;
    const workflowId = element.context?.workflowId;

    if (!repositoryName || !workflowId) {
      return [];
    }

    try {
      const repository = this.repositoryManager.getRepository(repositoryName);
      if (!repository) {
        return [];
      }

      // Get the full workflow item to access attachments
      const workflowItem = await repository.get(workflowId);
      if (!workflowItem || !workflowItem.attachments.length) {
        return [];
      }

      // Create tree items for each attachment
      return workflowItem.attachments.map(
        (attachment: WorkflowAttachment) =>
          new WorkflowTreeItem(
            attachment.name,
            'attachment',
            vscode.TreeItemCollapsibleState.None,
            {
              repository: repositoryName,
              workflowId: workflowId,
              attachmentName: attachment.name,
              attachmentPath: attachment.path,
              attachmentSize: attachment.size,
              attachmentMimeType: attachment.mimeType,
            }
          )
      );
    } catch (error) {
      return [
        new WorkflowTreeItem(
          `Error loading attachments: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'error',
          vscode.TreeItemCollapsibleState.None,
          { repository: repositoryName }
        ),
      ];
    }
  }

  private async filterItems(
    items: WorkflowTreeItem[],
    filter: string
  ): Promise<WorkflowTreeItem[]> {
    const filtered: WorkflowTreeItem[] = [];

    for (const item of items) {
      if (item.type === 'workflow') {
        // Check workflow metadata
        const metadata = item.context?.metadata;
        if (metadata && this.workflowMatchesFilter(metadata, filter)) {
          filtered.push(item);
        }
      } else if (item.type === 'folder') {
        // For folders, check if they contain any matching workflows recursively
        const hasMatchingWorkflows = await this.folderContainsMatchingWorkflows(item, filter);
        if (hasMatchingWorkflows) {
          filtered.push(item);
        }
      }
    }

    return filtered;
  }

  private async folderContainsMatchingWorkflows(
    folderItem: WorkflowTreeItem,
    filter: string
  ): Promise<boolean> {
    const repositoryName = folderItem.context?.repository;
    const folderPath = folderItem.context?.path;

    if (!repositoryName || !folderPath) {
      return false;
    }

    try {
      const repository = this.repositoryManager.getRepository(repositoryName);
      if (!repository) {
        return false;
      }

      const tree = await repository.getTreeStructure(folderPath);
      const items = this.convertTreeNodesToItems(tree.children || [], repositoryName);

      for (const item of items) {
        if (item.type === 'workflow') {
          const metadata = item.context?.metadata;
          if (metadata && this.workflowMatchesFilter(metadata, filter)) {
            return true;
          }
        } else if (item.type === 'folder') {
          // Recursively check subfolder
          const hasMatches = await this.folderContainsMatchingWorkflows(item, filter);
          if (hasMatches) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  private workflowMatchesFilter(metadata: WorkflowMetadata, filter: string): boolean {
    const lowerFilter = filter.toLowerCase();
    return (
      metadata.name.toLowerCase().includes(lowerFilter) ||
      metadata.description.toLowerCase().includes(lowerFilter) ||
      metadata.author.toLowerCase().includes(lowerFilter) ||
      metadata.tags.some((tag: string) => tag.toLowerCase().includes(lowerFilter))
    );
  }

  private convertTreeNodesToItems(
    nodes: readonly WorkflowTreeNode[],
    repositoryName: string
  ): WorkflowTreeItem[] {
    return nodes.map(node => {
      if (node.type === 'workflow') {
        const context: WorkflowTreeItemContext = {
          repository: repositoryName,
          path: node.path,
        };

        // Only add workflowId if it exists
        if (node.metadata?.id) {
          context.workflowId = node.metadata.id;
        }

        // Only add metadata if it exists
        if (node.metadata) {
          context.metadata = node.metadata;
        }

        // Determine if workflow should be expandable based on hasAttachments
        const collapsibleState = node.metadata?.hasAttachments
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.None;

        return new WorkflowTreeItem(node.name, 'workflow', collapsibleState, context);
      } else {
        return new WorkflowTreeItem(
          node.name,
          'folder',
          vscode.TreeItemCollapsibleState.Collapsed,
          {
            repository: repositoryName,
            path: node.path,
          }
        );
      }
    });
  }

  private async getRepositoryStatus(
    repo: RepositoryConfig
  ): Promise<'connected' | 'disconnected' | 'unknown'> {
    try {
      const repository = this.repositoryManager.getRepository(repo.name);
      if (!repository) {
        return 'disconnected';
      }

      // Test connectivity by trying to list workflows with a small limit
      await repository.list('', { limit: 1 });
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }

  private initializeRepositories(): void {
    this.repositoryManager = new WorkflowRepositoryManager();
    const repositories = this.configManager.getRepositories();

    repositories.forEach(repo => {
      try {
        this.repositoryManager.addRepository(repo);
      } catch (error) {
        console.error(`Failed to add repository ${repo.name}:`, error);
      }
    });
  }

  getRepositoryManager(): WorkflowRepositoryManager {
    return this.repositoryManager;
  }

  private getRepositoryErrorMessage(error: unknown, repositoryName: string): string {
    const repositoryConfig = this.configManager.getRepository(repositoryName);

    if (error instanceof Error) {
      const message = error.message;

      // Network/connection errors
      if (
        message.includes('fetch') ||
        message.includes('ENOTFOUND') ||
        message.includes('ECONNREFUSED')
      ) {
        if (repositoryConfig?.type === 'remote') {
          return `Cannot connect to ${repositoryConfig.url}. Check if the server is running and accessible.`;
        }
        return `Network error: ${message}`;
      }

      // Authentication errors
      if (message.includes('401') || message.includes('Unauthorized')) {
        return `Authentication failed. Please check your credentials.`;
      }

      // Server errors
      if (message.includes('500') || message.includes('Internal Server Error')) {
        return `Server error. The repository server may be experiencing issues.`;
      }

      // Not found errors
      if (message.includes('404') || message.includes('Not Found')) {
        return `Repository not found or server not responding. Please verify the URL.`;
      }

      // Timeout errors
      if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
        return `Connection timeout. The server may be slow or unreachable.`;
      }

      return `Error loading repository: ${message}`;
    }

    return `Unknown error loading repository "${repositoryName}"`;
  }
}

interface WorkflowTreeItemContext {
  repository?: string;
  repositoryConfig?: RepositoryConfig;
  path?: string;
  workflowId?: string;
  metadata?: WorkflowMetadata;
  status?: string;
  command?: vscode.Command;
  attachmentName?: string;
  attachmentPath?: string;
  attachmentSize?: number;
  attachmentMimeType?: string;
}

export class WorkflowTreeItem extends vscode.TreeItem {
  constructor(
    public override readonly label: string,
    public readonly type: 'repository' | 'folder' | 'workflow' | 'attachment' | 'message' | 'error',
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly context?: WorkflowTreeItemContext
  ) {
    super(label, collapsibleState);

    this.tooltip = this.getTooltip();
    const iconPath = this.getIcon();
    if (iconPath) {
      this.iconPath = iconPath;
    }
    const command = this.getCommand();
    if (command) {
      this.command = command;
    }
    this.contextValue = this.getContextValueString();
    const description = this.getDescription();
    if (description) {
      this.description = description;
    }
  }

  private getTooltip(): string {
    switch (this.type) {
      case 'repository': {
        const config = this.context?.repositoryConfig;
        const status = this.context?.status || 'unknown';
        if (config) {
          const typeDesc =
            config.type === 'local' ? `Local: ${config.path}` : `Remote: ${config.url}`;
          const defaultDesc = config.isDefault ? ' (Default)' : '';
          return `${this.label}${defaultDesc}\n${typeDesc}\nStatus: ${status}`;
        }
        return `Repository: ${this.label} (${status})`;
      }
      case 'workflow': {
        const metadata = this.context?.metadata;
        if (metadata) {
          return `${metadata.name}\nAuthor: ${metadata.author}\nDescription: ${metadata.description}\nTags: ${metadata.tags.join(', ')}`;
        }
        return `Workflow: ${this.label}`;
      }
      case 'attachment': {
        const size = this.context?.attachmentSize;
        const mimeType = this.context?.attachmentMimeType;
        const sizeStr = size ? `\nSize: ${(size / 1024).toFixed(1)} KB` : '';
        const typeStr = mimeType ? `\nType: ${mimeType}` : '';
        return `Attachment: ${this.label}${sizeStr}${typeStr}`;
      }
      case 'folder':
        return `Folder: ${this.label}`;
      default:
        return this.label;
    }
  }

  private getDescription(): string | undefined {
    switch (this.type) {
      case 'repository': {
        const config = this.context?.repositoryConfig;
        if (config) {
          let desc = config.type;
          if (config.isDefault) {
            desc += ' • default';
          }
          return desc;
        }
        return undefined;
      }
      case 'workflow': {
        const metadata = this.context?.metadata;
        return metadata ? `${metadata.author}` : undefined;
      }
      case 'attachment': {
        const size = this.context?.attachmentSize;
        return size ? `${(size / 1024).toFixed(1)} KB` : undefined;
      }
      default:
        return undefined;
    }
  }

  private getIcon(): vscode.ThemeIcon | undefined {
    switch (this.type) {
      case 'repository': {
        const status = this.context?.status;
        const config = this.context?.repositoryConfig;

        if (config?.type === 'remote') {
          if (status === 'connected') {
            return new vscode.ThemeIcon('cloud');
          } else if (status === 'disconnected') {
            return new vscode.ThemeIcon('cloud-offline', new vscode.ThemeColor('errorForeground'));
          } else {
            return new vscode.ThemeIcon('cloud', new vscode.ThemeColor('disabledForeground'));
          }
        } else {
          if (status === 'connected') {
            return new vscode.ThemeIcon('folder-library');
          } else if (status === 'disconnected') {
            return new vscode.ThemeIcon('folder-library', new vscode.ThemeColor('errorForeground'));
          } else {
            return new vscode.ThemeIcon(
              'folder-library',
              new vscode.ThemeColor('disabledForeground')
            );
          }
        }
      }
      case 'folder':
        return vscode.ThemeIcon.Folder;
      case 'workflow':
        return new vscode.ThemeIcon('file-code');
      case 'attachment':
        return new vscode.ThemeIcon('paperclip');
      case 'error':
        return new vscode.ThemeIcon('error');
      case 'message':
        return new vscode.ThemeIcon('info');
      default:
        return undefined;
    }
  }

  private getCommand(): vscode.Command | undefined {
    if (this.type === 'workflow' && this.context?.workflowId) {
      return {
        command: 'extremexp.workflows.openWorkflow',
        title: 'Open Workflow',
        arguments: [this.context.repository, this.context.workflowId],
      };
    }

    if (this.type === 'attachment') {
      return {
        command: 'extremexp.workflows.openAttachment',
        title: 'Open Attachment',
        arguments: [this],
      };
    }

    if (this.type === 'message' && this.context?.command) {
      return this.context.command;
    }

    return undefined;
  }

  private getContextValueString(): string {
    switch (this.type) {
      case 'repository': {
        const status = this.context?.status || 'unknown';
        return `workflow-repository-${status}`;
      }
      case 'folder':
        return 'workflow-folder';
      case 'workflow':
        return 'workflow-item';
      case 'attachment':
        return 'workflow-attachment';
      default:
        return this.type;
    }
  }
}
