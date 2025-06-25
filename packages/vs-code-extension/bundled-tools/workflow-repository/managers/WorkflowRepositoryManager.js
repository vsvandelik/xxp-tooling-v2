import { LocalWorkflowRepository } from '../repositories/LocalWorkflowRepository.js';
import { RemoteWorkflowRepository } from '../repositories/RemoteWorkflowRepository.js';
export class WorkflowRepositoryManager {
    repositories = new Map();
    configs = new Map();
    defaultRepositoryName;
    addRepository(config) {
        this.configs.set(config.name, config);
        if (config.type === 'local') {
            this.repositories.set(config.name, new LocalWorkflowRepository(config.path));
        }
        else if (config.type === 'remote') {
            if (!config.url) {
                throw new Error('Remote repository requires URL');
            }
            const authToken = config.authToken;
            let username;
            let password;
            if (authToken && authToken.includes(':')) {
                [username, password] = authToken.split(':', 2);
            }
            this.repositories.set(config.name, new RemoteWorkflowRepository(config.url, username, password));
        }
        if (config.isDefault) {
            this.defaultRepositoryName = config.name;
        }
    }
    removeRepository(name) {
        this.repositories.delete(name);
        this.configs.delete(name);
        if (this.defaultRepositoryName === name) {
            const remainingRepos = Array.from(this.repositories.keys());
            if (remainingRepos.length > 0 && remainingRepos[0]) {
                this.defaultRepositoryName = remainingRepos[0];
            }
            else {
                delete this.defaultRepositoryName;
            }
        }
        return true;
    }
    getRepository(name) {
        const repositoryName = name || this.defaultRepositoryName;
        if (!repositoryName) {
            return null;
        }
        return this.repositories.get(repositoryName) || null;
    }
    getRepositoryConfig(name) {
        return this.configs.get(name) || null;
    }
    listRepositories() {
        return Array.from(this.configs.values());
    }
    async listWorkflows(repositoryName, path, options) {
        const repository = this.getRepository(repositoryName);
        if (!repository) {
            throw new Error(`Repository ${repositoryName || 'default'} not found`);
        }
        return repository.list(path, options);
    }
    async getWorkflow(workflowId, repositoryName) {
        const repository = this.getRepository(repositoryName);
        if (!repository) {
            throw new Error(`Repository ${repositoryName || 'default'} not found`);
        }
        return repository.get(workflowId);
    }
    async uploadWorkflow(path, content, metadata, repositoryName) {
        const repository = this.getRepository(repositoryName);
        if (!repository) {
            throw new Error(`Repository ${repositoryName || 'default'} not found`);
        }
        return repository.upload(path, content, metadata);
    }
    async updateWorkflow(workflowId, content, metadata, repositoryName) {
        const repository = this.getRepository(repositoryName);
        if (!repository) {
            throw new Error(`Repository ${repositoryName || 'default'} not found`);
        }
        return repository.update(workflowId, content, metadata);
    }
    async deleteWorkflow(workflowId, repositoryName) {
        const repository = this.getRepository(repositoryName);
        if (!repository) {
            throw new Error(`Repository ${repositoryName || 'default'} not found`);
        }
        return repository.delete(workflowId);
    }
    async searchWorkflows(options, repositoryName) {
        const repository = this.getRepository(repositoryName);
        if (!repository) {
            throw new Error(`Repository ${repositoryName || 'default'} not found`);
        }
        return repository.search(options);
    }
    async getTreeStructure(repositoryName, path) {
        const repository = this.getRepository(repositoryName);
        if (!repository) {
            throw new Error(`Repository ${repositoryName || 'default'} not found`);
        }
        return repository.getTreeStructure(path);
    }
    async searchAllRepositories(options) {
        const results = new Map();
        for (const [name, repository] of this.repositories) {
            try {
                const workflows = await repository.search(options);
                results.set(name, workflows);
            }
            catch (error) {
                console.error(`Failed to search repository ${name}:`, error);
                results.set(name, []);
            }
        }
        return results;
    }
}
//# sourceMappingURL=WorkflowRepositoryManager.js.map