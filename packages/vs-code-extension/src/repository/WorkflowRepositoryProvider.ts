import * as vscode from 'vscode';
import {
  WorkflowRepositoryManager,
  WorkflowTreeNode,
  WorkflowMetadata,
  RepositoryConfig,
} from '@extremexp/workflow-repository';
import { RepositoryConfigManager } from './RepositoryConfigManager.js';

export class WorkflowRepositoryProvider implements vscode.TreeDataProvider<WorkflowTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    WorkflowTreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private repositoryManager = new WorkflowRepositoryManager();

  constructor(private configManager: RepositoryConfigManager) {
    this.initializeRepositories();
    this.configManager.onConfigurationChanged(() => {
      this.initializeRepositories();
      this.refresh();
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
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
      return this.convertTreeNodesToItems(tree.children || [], repositoryName);
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
      return this.convertTreeNodesToItems(tree.children || [], repositoryName);
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

        return new WorkflowTreeItem(
          node.name,
          'workflow',
          vscode.TreeItemCollapsibleState.None,
          context
        );
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
}

interface WorkflowTreeItemContext {
  repository?: string;
  repositoryConfig?: RepositoryConfig;
  path?: string;
  workflowId?: string;
  metadata?: WorkflowMetadata;
  status?: string;
  command?: vscode.Command;
}

export class WorkflowTreeItem extends vscode.TreeItem {
  constructor(
    public override readonly label: string,
    public readonly type: 'repository' | 'folder' | 'workflow' | 'message' | 'error',
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
          return `${metadata.name}\nAuthor: ${metadata.author}\nVersion: ${metadata.version}\nDescription: ${metadata.description}`;
        }
        return `Workflow: ${this.label}`;
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
        return metadata ? `v${metadata.version} • ${metadata.author}` : undefined;
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
      default:
        return this.type;
    }
  }
}
