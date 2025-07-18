/**
 * Workflow repository manager for coordinating multiple repositories.
 * Manages a collection of local and remote workflow repositories and provides
 * a unified interface for multi-repository operations.
 */

import { IWorkflowRepository, WorkflowTreeNode } from '../interfaces/IWorkflowRepository.js';
import { RepositoryConfig, WorkflowSearchOptions } from '../models/RepositoryConfig.js';
import { WorkflowItem, WorkflowContent } from '../models/WorkflowItem.js';
import { WorkflowMetadata } from '../models/WorkflowMetadata.js';
import { LocalWorkflowRepository } from '../repositories/LocalWorkflowRepository.js';
import { RemoteWorkflowRepository } from '../repositories/RemoteWorkflowRepository.js';

/**
 * Manager for coordinating multiple workflow repositories.
 * Provides a unified interface for working with multiple local and remote
 * repositories simultaneously, including cross-repository search and operations.
 */
export class WorkflowRepositoryManager {
  private repositories = new Map<string, IWorkflowRepository>();
  private configs = new Map<string, RepositoryConfig>();
  private defaultRepositoryName?: string;

  addRepository(config: RepositoryConfig): void {
    this.configs.set(config.name, config);

    if (config.type === 'local') {
      this.repositories.set(config.name, new LocalWorkflowRepository(config.path));
    } else if (config.type === 'remote') {
      if (!config.url) {
        throw new Error('Remote repository requires URL');
      }

      const authToken = config.authToken;
      let username: string | undefined;
      let password: string | undefined;

      if (authToken && authToken.includes(':')) {
        [username, password] = authToken.split(':', 2);
      }

      this.repositories.set(
        config.name,
        new RemoteWorkflowRepository(config.url, username, password)
      );
    }

    if (config.isDefault) {
      this.defaultRepositoryName = config.name;
    }
  }

  removeRepository(name: string): boolean {
    this.repositories.delete(name);
    this.configs.delete(name);

    if (this.defaultRepositoryName === name) {
      const remainingRepos = Array.from(this.repositories.keys());
      if (remainingRepos.length > 0 && remainingRepos[0]) {
        this.defaultRepositoryName = remainingRepos[0];
      } else {
        delete this.defaultRepositoryName;
      }
    }

    return true;
  }

  getRepository(name?: string): IWorkflowRepository | null {
    const repositoryName = name || this.defaultRepositoryName;
    if (!repositoryName) {
      return null;
    }

    return this.repositories.get(repositoryName) || null;
  }

  getRepositoryConfig(name: string): RepositoryConfig | null {
    return this.configs.get(name) || null;
  }

  listRepositories(): readonly RepositoryConfig[] {
    return Array.from(this.configs.values());
  }

  async listWorkflows(
    repositoryName?: string,
    path?: string,
    options?: WorkflowSearchOptions
  ): Promise<readonly WorkflowMetadata[]> {
    const repository = this.getRepository(repositoryName);
    if (!repository) {
      throw new Error(`Repository ${repositoryName || 'default'} not found`);
    }

    return repository.list(path, options);
  }

  async getWorkflow(workflowId: string, repositoryName?: string): Promise<WorkflowItem | null> {
    const repository = this.getRepository(repositoryName);
    if (!repository) {
      throw new Error(`Repository ${repositoryName || 'default'} not found`);
    }

    return repository.get(workflowId);
  }

  async uploadWorkflow(
    path: string,
    content: WorkflowContent,
    metadata: Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>,
    repositoryName?: string
  ): Promise<WorkflowMetadata> {
    const repository = this.getRepository(repositoryName);
    if (!repository) {
      throw new Error(`Repository ${repositoryName || 'default'} not found`);
    }

    return repository.upload(path, content, metadata);
  }

  async updateWorkflow(
    workflowId: string,
    content: WorkflowContent,
    metadata: Partial<Omit<WorkflowMetadata, 'id' | 'createdAt' | 'modifiedAt' | 'hasAttachments'>>,
    repositoryName?: string
  ): Promise<WorkflowMetadata> {
    const repository = this.getRepository(repositoryName);
    if (!repository) {
      throw new Error(`Repository ${repositoryName || 'default'} not found`);
    }

    return repository.update(workflowId, content, metadata);
  }

  async deleteWorkflow(workflowId: string, repositoryName?: string): Promise<boolean> {
    const repository = this.getRepository(repositoryName);
    if (!repository) {
      throw new Error(`Repository ${repositoryName || 'default'} not found`);
    }

    return repository.delete(workflowId);
  }

  async searchWorkflows(
    options: WorkflowSearchOptions,
    repositoryName?: string
  ): Promise<readonly WorkflowMetadata[]> {
    const repository = this.getRepository(repositoryName);
    if (!repository) {
      throw new Error(`Repository ${repositoryName || 'default'} not found`);
    }

    return repository.search(options);
  }

  async getTreeStructure(repositoryName?: string, path?: string): Promise<WorkflowTreeNode> {
    const repository = this.getRepository(repositoryName);
    if (!repository) {
      throw new Error(`Repository ${repositoryName || 'default'} not found`);
    }

    return repository.getTreeStructure(path);
  }

  async searchAllRepositories(
    options: WorkflowSearchOptions
  ): Promise<Map<string, readonly WorkflowMetadata[]>> {
    const results = new Map<string, readonly WorkflowMetadata[]>();

    for (const [name, repository] of this.repositories) {
      try {
        const workflows = await repository.search(options);
        results.set(name, workflows);
      } catch (error) {
        console.error(`Failed to search repository ${name}:`, error);
        results.set(name, []);
      }
    }

    return results;
  }
}
