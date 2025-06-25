export class RemoteWorkflowRepository {
    baseUrl;
    username;
    password;
    authToken;
    constructor(baseUrl, username, password) {
        this.baseUrl = baseUrl;
        this.username = username;
        this.password = password;
    }
    async authenticate() {
        if (!this.username || !this.password) {
            return false;
        }
        try {
            const loginRequest = {
                username: this.username,
                password: this.password,
            };
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginRequest),
            });
            const result = await response.json();
            if (result.success && result.data) {
                this.authToken = result.data.token;
                return true;
            }
            return false;
        }
        catch {
            return false;
        }
    }
    async list(path, options) {
        const params = new URLSearchParams();
        if (path)
            params.set('path', path);
        if (options?.query)
            params.set('query', options.query);
        if (options?.author)
            params.set('author', options.author);
        if (options?.tags)
            params.set('tags', options.tags.join(','));
        if (options?.limit)
            params.set('limit', options.limit.toString());
        if (options?.offset)
            params.set('offset', options.offset.toString());
        const response = await this.makeRequest(`/workflows?${params}`);
        const result = await response.json();
        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to list workflows');
        }
        return result.data.workflows;
    }
    async get(id) {
        try {
            const metadataResponse = await this.makeRequest(`/workflows/${id}`);
            const metadataResult = await metadataResponse.json();
            if (!metadataResult.success || !metadataResult.data) {
                return null;
            }
            const content = await this.getContent(id);
            if (!content) {
                return null;
            }
            const attachments = await this.loadAttachments(id, metadataResult.data);
            return {
                metadata: metadataResult.data,
                mainFileContent: content.mainFile,
                attachments,
            };
        }
        catch {
            return null;
        }
    }
    async getContent(id) {
        try {
            const response = await this.makeRequest(`/workflows/${id}/content`);
            if (!response.ok) {
                return null;
            }
            const arrayBuffer = await response.arrayBuffer();
            const JSZip = await import('jszip');
            const zip = await JSZip.default.loadAsync(arrayBuffer);
            const manifestFile = zip.file('workflow.json');
            if (!manifestFile) {
                return null;
            }
            const manifestContent = await manifestFile.async('string');
            const metadata = JSON.parse(manifestContent);
            const mainFileContent = await zip.file(metadata.mainFile)?.async('string');
            if (!mainFileContent) {
                return null;
            }
            const attachments = new Map();
            for (const [fileName, file] of Object.entries(zip.files)) {
                if (fileName !== 'workflow.json' && fileName !== metadata.mainFile && !file.dir) {
                    const content = await file.async('nodebuffer');
                    attachments.set(fileName, content);
                }
            }
            return {
                mainFile: mainFileContent,
                attachments,
            };
        }
        catch {
            return null;
        }
    }
    async upload(path, content, metadata) {
        await this.ensureAuthenticated();
        const zipBuffer = await this.createWorkflowZip(content, metadata);
        const formData = new FormData();
        formData.append('workflow', new Blob([zipBuffer]), 'workflow.zip');
        const uploadRequest = {
            path,
            name: metadata.name,
            description: metadata.description,
            author: metadata.author,
            tags: [...metadata.tags],
            mainFile: metadata.mainFile,
        };
        Object.entries(uploadRequest).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            }
            else {
                formData.append(key, value.toString());
            }
        });
        const response = await this.makeRequest('/workflows', {
            method: 'POST',
            body: formData,
            skipContentType: true,
        });
        const result = await response.json();
        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to upload workflow');
        }
        return result.data;
    }
    async update(id, content, metadata) {
        await this.ensureAuthenticated();
        const zipBuffer = await this.createWorkflowZip(content, metadata);
        const formData = new FormData();
        formData.append('workflow', new Blob([zipBuffer]), 'workflow.zip');
        const updateRequest = {
            ...(metadata.name ? { name: metadata.name } : {}),
            ...(metadata.description ? { description: metadata.description } : {}),
            ...(metadata.tags ? { tags: [...metadata.tags] } : {}),
        };
        Object.entries(updateRequest).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            }
            else {
                formData.append(key, value.toString());
            }
        });
        const response = await this.makeRequest(`/workflows/${id}`, {
            method: 'PUT',
            body: formData,
            skipContentType: true,
        });
        const result = await response.json();
        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to update workflow');
        }
        return result.data;
    }
    async delete(id) {
        await this.ensureAuthenticated();
        try {
            const response = await this.makeRequest(`/workflows/${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            return result.success;
        }
        catch {
            return false;
        }
    }
    async exists(id) {
        try {
            const response = await this.makeRequest(`/workflows/${id}`);
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async search(options) {
        const params = new URLSearchParams();
        if (options.query)
            params.set('query', options.query);
        if (options.author)
            params.set('author', options.author);
        if (options.tags)
            params.set('tags', options.tags.join(','));
        if (options.path)
            params.set('path', options.path);
        if (options.limit)
            params.set('limit', options.limit.toString());
        if (options.offset)
            params.set('offset', options.offset.toString());
        const response = await this.makeRequest(`/search?${params}`);
        const result = await response.json();
        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to search workflows');
        }
        return result.data.workflows;
    }
    async getTreeStructure(path) {
        const url = path ? `/tree/${path}` : '/tree';
        const response = await this.makeRequest(url);
        const result = await response.json();
        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to get tree structure');
        }
        return result.data.tree;
    }
    async getTags() {
        const response = await this.makeRequest('/tags');
        const result = await response.json();
        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to get tags');
        }
        return result.data.tags;
    }
    async getAuthors() {
        const response = await this.makeRequest('/authors');
        const result = await response.json();
        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to get authors');
        }
        return result.data.authors;
    }
    async makeRequest(endpoint, options = {}) {
        const headers = {
            ...(options.skipContentType ? {} : { 'Content-Type': 'application/json' }),
        };
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                ...headers,
                ...options.headers,
            },
        });
        if (response.status === 401 && this.username && this.password) {
            const authenticated = await this.authenticate();
            if (authenticated) {
                headers['Authorization'] = `Bearer ${this.authToken}`;
                return fetch(`${this.baseUrl}${endpoint}`, {
                    ...options,
                    headers: {
                        ...headers,
                        ...options.headers,
                    },
                });
            }
        }
        return response;
    }
    async ensureAuthenticated() {
        if (!this.authToken && this.username && this.password) {
            const authenticated = await this.authenticate();
            if (!authenticated) {
                throw new Error('Authentication failed');
            }
        }
    }
    async createWorkflowZip(content, metadata) {
        const JSZip = await import('jszip');
        const zip = new JSZip.default();
        zip.file(metadata.mainFile || 'main.xxp', content.mainFile);
        for (const [fileName, fileContent] of content.attachments) {
            zip.file(fileName, fileContent);
        }
        zip.file('workflow.json', JSON.stringify({
            name: metadata.name,
            description: metadata.description,
            author: metadata.author,
            tags: metadata.tags,
            mainFile: metadata.mainFile || 'main.xxp',
        }, null, 2));
        const buffer = await zip.generateAsync({ type: 'nodebuffer' });
        return buffer;
    }
    async loadAttachments(workflowId, metadata) {
        if (!metadata.hasAttachments) {
            return [];
        }
        try {
            const content = await this.getContent(workflowId);
            if (!content) {
                return [];
            }
            const attachments = [];
            for (const [fileName] of content.attachments) {
                attachments.push({
                    name: fileName,
                    path: `${metadata.path}/${fileName}`,
                    size: content.attachments.get(fileName)?.length || 0,
                    mimeType: this.getMimeType(fileName),
                    createdAt: metadata.createdAt,
                    modifiedAt: metadata.modifiedAt,
                });
            }
            return attachments;
        }
        catch {
            return [];
        }
    }
    getMimeType(fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const mimeTypes = {
            py: 'text/x-python',
            js: 'application/javascript',
            ts: 'application/typescript',
            json: 'application/json',
            txt: 'text/plain',
            md: 'text/markdown',
            xxp: 'application/x-xxp',
            espace: 'application/x-espace',
        };
        return mimeTypes[ext || ''] || 'application/octet-stream';
    }
}
//# sourceMappingURL=RemoteWorkflowRepository.js.map