import * as vscode from 'vscode';
import { RepositoryConfig } from '@extremexp/workflow-repository';

// Mutable version of RepositoryConfig for internal use
interface MutableRepositoryConfig {
  type: 'local' | 'remote';
  name: string;
  path: string;
  url?: string;
  authToken?: string;
  isDefault?: boolean;
}

export class RepositoryConfigManager {
  private static readonly CONFIG_SECTION = 'extremexp.workflows';
  private configChangeEmitter = new vscode.EventEmitter<void>();

  readonly onConfigurationChanged = this.configChangeEmitter.event;

  constructor(private context: vscode.ExtensionContext) {
    this.setupConfigurationListener();
  }
  getRepositories(): RepositoryConfig[] {
    const config = vscode.workspace.getConfiguration(RepositoryConfigManager.CONFIG_SECTION);
    const repositories = config.get<MutableRepositoryConfig[]>('repositories', []);

    return repositories.map(repo => ({
      ...repo,
      isDefault: repo.isDefault || false,
    }));
  }
  getDefaultRepository(): RepositoryConfig | null {
    const repositories = this.getRepositories();
    const defaultRepo = repositories.find(repo => repo.isDefault);

    if (defaultRepo) {
      return defaultRepo;
    }

    return repositories.length > 0 ? repositories[0] || null : null;
  }
  getRepository(name: string): RepositoryConfig | null {
    const repositories = this.getRepositories();
    return repositories.find(repo => repo.name === name) ?? null;
  }
  async addRepository(repository: RepositoryConfig): Promise<void> {
    const repositories = this.getRepositories();
    const mutableRepos: MutableRepositoryConfig[] = repositories.map(repo => ({ ...repo }));
    const existingIndex = mutableRepos.findIndex(repo => repo.name === repository.name);

    const mutableRepo: MutableRepositoryConfig = { ...repository };

    if (existingIndex >= 0) {
      mutableRepos[existingIndex] = mutableRepo;
    } else {
      mutableRepos.push(mutableRepo);
    }

    if (repository.isDefault) {
      mutableRepos.forEach(repo => {
        if (repo.name !== repository.name) {
          repo.isDefault = false;
        }
      });
    }

    await this.saveRepositories(mutableRepos);
  }
  async removeRepository(name: string): Promise<void> {
    const repositories = this.getRepositories();
    const mutableRepos: MutableRepositoryConfig[] = repositories.map(repo => ({ ...repo }));
    const filteredRepos = mutableRepos.filter(repo => repo.name !== name);

    if (filteredRepos.length !== repositories.length) {
      if (filteredRepos.length > 0) {
        const hasDefault = filteredRepos.some(repo => repo.isDefault);
        if (!hasDefault && filteredRepos[0]) {
          filteredRepos[0].isDefault = true;
        }
      }
      await this.saveRepositories(filteredRepos);
    }
  }
  async setDefaultRepository(name: string): Promise<void> {
    const repositories = this.getRepositories();
    const mutableRepos: MutableRepositoryConfig[] = repositories.map(repo => ({ ...repo }));
    let found = false;

    mutableRepos.forEach(repo => {
      if (repo.name === name) {
        repo.isDefault = true;
        found = true;
      } else {
        repo.isDefault = false;
      }
    });

    if (found) {
      await this.saveRepositories(mutableRepos);
    }
  }

  async promptForRepositoryConfig(): Promise<RepositoryConfig | null> {
    const type = await vscode.window.showQuickPick(
      [
        {
          label: '📁 Local Repository',
          description: 'File system based repository',
          value: 'local' as const,
        },
        {
          label: '🌐 Remote Repository',
          description: 'Server based repository',
          value: 'remote' as const,
        },
      ],
      {
        placeHolder: 'Select repository type',
        title: 'Add Workflow Repository',
      }
    );

    if (!type) {
      return null;
    }

    const name = await vscode.window.showInputBox({
      prompt: 'Enter a unique name for this repository',
      placeHolder: 'my-workflows',
      validateInput: value => {
        if (!value.trim()) {
          return 'Repository name is required';
        }
        const existing = this.getRepository(value.trim());
        if (existing) {
          return 'A repository with this name already exists';
        }
        return null;
      },
    });

    if (!name) {
      return null;
    }

    if (type.value === 'local') {
      return await this.configureLocalRepository(name.trim());
    } else {
      return await this.configureRemoteRepository(name.trim());
    }
  }
  private async configureLocalRepository(name: string): Promise<RepositoryConfig | null> {
    const pathUri = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: 'Select Repository Folder',
      title: 'Select Local Repository Folder',
    });

    if (!pathUri || pathUri.length === 0 || !pathUri[0]) {
      return null;
    }

    const isDefault = await this.promptForDefault();

    return {
      type: 'local',
      name,
      path: pathUri[0].fsPath,
      isDefault,
    };
  }
  private async configureRemoteRepository(name: string): Promise<RepositoryConfig | null> {
    const url = await vscode.window.showInputBox({
      prompt: 'Enter the repository server URL',
      placeHolder: 'http://localhost:3001',
      validateInput: value => {
        if (!value.trim()) {
          return 'Server URL is required';
        }
        try {
          new URL(value.trim());
          return null;
        } catch {
          return 'Please enter a valid URL';
        }
      },
    });

    if (!url) {
      return null;
    }

    const needsAuth = await vscode.window.showQuickPick(
      [
        {
          label: 'No authentication',
          description: 'Repository is publicly accessible',
          value: false,
        },
        {
          label: 'Username and password',
          description: 'Repository requires authentication',
          value: true,
        },
      ],
      {
        placeHolder: 'Does this repository require authentication?',
        title: 'Authentication Setup',
      }
    );

    if (needsAuth === undefined) {
      return null;
    }

    let authToken: string | undefined;
    if (needsAuth.value) {
      authToken = await this.promptForCredentials();
      if (authToken === undefined) {
        return null;
      }
    }

    const isDefault = await this.promptForDefault();

    return {
      type: 'remote',
      name,
      path: '', // Not used for remote
      url: url.trim(),
      ...(authToken ? { authToken } : {}),
      isDefault,
    };
  }

  private async promptForCredentials(): Promise<string | undefined> {
    const username = await vscode.window.showInputBox({
      prompt: 'Enter username',
      placeHolder: 'username',
      validateInput: value => {
        if (!value.trim()) {
          return 'Username is required';
        }
        return null;
      },
    });

    if (!username) {
      return undefined;
    }

    const password = await vscode.window.showInputBox({
      prompt: 'Enter password',
      password: true,
      validateInput: value => {
        if (!value) {
          return 'Password is required';
        }
        return null;
      },
    });

    if (!password) {
      return undefined;
    }

    return `${username.trim()}:${password}`;
  }

  private async promptForDefault(): Promise<boolean> {
    const repositories = this.getRepositories();
    if (repositories.length === 0) {
      return true; // First repository is automatically default
    }

    const makeDefault = await vscode.window.showQuickPick(
      [
        { label: 'Yes', description: 'Make this the default repository', value: true },
        { label: 'No', description: 'Keep existing default repository', value: false },
      ],
      {
        placeHolder: 'Make this the default repository?',
        title: 'Default Repository',
      }
    );

    return makeDefault?.value || false;
  }

  async validateRepositoryConfig(config: RepositoryConfig): Promise<string[]> {
    const errors: string[] = [];

    if (!config.name.trim()) {
      errors.push('Repository name is required');
    }

    if (config.type === 'local') {
      if (!config.path.trim()) {
        errors.push('Repository path is required for local repositories');
      }
    } else if (config.type === 'remote') {
      if (!config.url?.trim()) {
        errors.push('Repository URL is required for remote repositories');
      } else {
        try {
          new URL(config.url);
        } catch {
          errors.push('Invalid repository URL format');
        }
      }
    }

    return errors;
  }
  private async saveRepositories(repositories: MutableRepositoryConfig[]): Promise<void> {
    const config = vscode.workspace.getConfiguration(RepositoryConfigManager.CONFIG_SECTION);
    await config.update('repositories', repositories, vscode.ConfigurationTarget.Global);
  }

  private setupConfigurationListener(): void {
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(RepositoryConfigManager.CONFIG_SECTION)) {
          this.configChangeEmitter.fire();
        }
      })
    );
  }

  dispose(): void {
    this.configChangeEmitter.dispose();
  }
}
