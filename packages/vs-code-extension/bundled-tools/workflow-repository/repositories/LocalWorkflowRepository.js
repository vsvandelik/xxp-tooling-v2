import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
export class LocalWorkflowRepository {
    basePath;
    constructor(basePath) {
        this.basePath = basePath;
    }
    async list(workflowPath, options) {
        const searchPath = workflowPath ? path.join(this.basePath, workflowPath) : this.basePath;
        const workflows = [];
        await this.collectWorkflows(searchPath, workflows, workflowPath || '');
        if (options) {
            return this.filterWorkflows(workflows, options);
        }
        return workflows;
    }
    async get(id) {
        const metadata = await this.findWorkflowById(id);
        if (!metadata) {
            return null;
        }
        const content = await this.getContent(id);
        if (!content) {
            return null;
        }
        const attachments = await this.loadAttachments(metadata.path);
        return {
            metadata,
            mainFileContent: content.mainFile,
            attachments,
        };
    }
    async getContent(id) {
        const metadata = await this.findWorkflowById(id);
        if (!metadata) {
            return null;
        }
        const workflowDir = path.join(this.basePath, metadata.path);
        if (metadata.path.endsWith('.xxp') || metadata.path.endsWith('.espace')) {
            const filePath = path.join(this.basePath, metadata.path);
            try {
                const mainFile = await fs.readFile(filePath, 'utf-8');
                return { mainFile, attachments: new Map() };
            }
            catch {
                return null;
            }
        }
        const mainFilePath = path.join(workflowDir, metadata.mainFile);
        try {
            const mainFile = await fs.readFile(mainFilePath, 'utf-8');
            const attachments = new Map();
            const files = await fs.readdir(workflowDir);
            for (const file of files) {
                if (file !== metadata.mainFile && file !== 'workflow.json') {
                    const filePath = path.join(workflowDir, file);
                    const stats = await fs.stat(filePath);
                    if (stats.isFile()) {
                        const content = await fs.readFile(filePath);
                        attachments.set(file, content);
                    }
                }
            }
            return { mainFile, attachments };
        }
        catch (error) {
            return null;
        }
    }
    async upload(workflowPath, content, metadata) {
        const workflowFolderName = this.sanitizeFileName(metadata.name);
        const fullWorkflowPath = path.join(workflowPath, workflowFolderName);
        const id = this.generateId(fullWorkflowPath, metadata.name);
        const existing = await this.findWorkflowById(id);
        if (existing) {
            throw new Error(`Workflow "${metadata.name}" already exists at path "${workflowPath}". ` +
                `Use delete and upload to modify it or choose a different name.`);
        }
        const workflowDir = path.join(this.basePath, fullWorkflowPath);
        try {
            await fs.access(workflowDir);
            throw new Error(`Directory "${workflowFolderName}" already exists at path "${workflowPath}". ` +
                `Please choose a different workflow name.`);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
        await fs.mkdir(workflowDir, { recursive: true });
        const mainFilePath = path.join(workflowDir, metadata.mainFile);
        await fs.writeFile(mainFilePath, content.mainFile, 'utf-8');
        for (const [fileName, fileContent] of content.attachments) {
            const filePath = path.join(workflowDir, fileName);
            await fs.writeFile(filePath, fileContent);
        }
        const now = new Date();
        const fullMetadata = {
            ...metadata,
            id,
            createdAt: now,
            modifiedAt: now,
            path: this.normalizePath(fullWorkflowPath),
            hasAttachments: content.attachments.size > 0,
        };
        await this.saveManifest(workflowDir, fullMetadata);
        return fullMetadata;
    }
    async update(id, content, metadata) {
        const existingMetadata = await this.findWorkflowById(id);
        if (!existingMetadata) {
            throw new Error(`Workflow with id ${id} not found`);
        }
        const workflowDir = path.join(this.basePath, existingMetadata.path);
        if (content.mainFile) {
            const mainFilePath = path.join(workflowDir, existingMetadata.mainFile);
            await fs.writeFile(mainFilePath, content.mainFile, 'utf-8');
        }
        const files = await fs.readdir(workflowDir);
        for (const file of files) {
            if (file !== existingMetadata.mainFile && file !== 'workflow.json') {
                await fs.unlink(path.join(workflowDir, file));
            }
        }
        for (const [fileName, fileContent] of content.attachments) {
            const filePath = path.join(workflowDir, fileName);
            await fs.writeFile(filePath, fileContent);
        }
        const updatedMetadata = {
            ...existingMetadata,
            ...metadata,
            modifiedAt: new Date(),
            hasAttachments: content.attachments.size > 0,
        };
        await this.saveManifest(workflowDir, updatedMetadata);
        return updatedMetadata;
    }
    async delete(id) {
        const metadata = await this.findWorkflowById(id);
        if (!metadata) {
            return false;
        }
        const workflowDir = path.join(this.basePath, metadata.path);
        try {
            await fs.rm(workflowDir, { recursive: true, force: true });
            return true;
        }
        catch {
            return false;
        }
    }
    async exists(id) {
        const metadata = await this.findWorkflowById(id);
        return metadata !== null;
    }
    async search(options) {
        const allWorkflows = await this.list();
        return this.filterWorkflows(allWorkflows, options);
    }
    async getTreeStructure(workflowPath) {
        const searchPath = workflowPath ? path.join(this.basePath, workflowPath) : this.basePath;
        return await this.buildTreeNode(searchPath, workflowPath || '');
    }
    async collectWorkflows(searchPath, workflows, relativePath) {
        try {
            const entries = await fs.readdir(searchPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile() && (entry.name.endsWith('.xxp') || entry.name.endsWith('.espace'))) {
                    const metadata = await this.loadSingleFileWorkflow(path.join(searchPath, entry.name), path.join(relativePath, entry.name));
                    if (metadata) {
                        workflows.push(metadata);
                    }
                }
            }
            for (const entry of entries) {
                const fullPath = path.join(searchPath, entry.name);
                const relPath = path.join(relativePath, entry.name);
                if (entry.isDirectory()) {
                    const manifestPath = path.join(fullPath, 'workflow.json');
                    try {
                        await fs.access(manifestPath);
                        const metadata = await this.loadMetadata(fullPath);
                        if (metadata) {
                            workflows.push(metadata);
                        }
                    }
                    catch {
                        await this.collectWorkflows(fullPath, workflows, relPath);
                    }
                }
            }
        }
        catch {
        }
    }
    async loadSingleFileWorkflow(filePath, relativePath) {
        try {
            const stats = await fs.stat(filePath);
            const fileName = path.basename(filePath);
            const nameWithoutExt = path.parse(fileName).name;
            const content = await fs.readFile(filePath, 'utf-8');
            const metadata = this.extractMetadataFromContent(content, nameWithoutExt);
            const id = this.generateId(relativePath, nameWithoutExt);
            return {
                id,
                name: metadata.name || nameWithoutExt,
                description: metadata.description || `Single-file workflow: ${fileName}`,
                author: metadata.author || 'Unknown',
                tags: metadata.tags || [],
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                path: this.normalizePath(relativePath),
                hasAttachments: false,
                mainFile: fileName,
            };
        }
        catch {
            return null;
        }
    }
    extractMetadataFromContent(content, defaultName) {
        const metadata = {
            name: defaultName,
            description: '',
            author: 'Unknown',
            tags: [],
        };
        const lines = content.split('\n').slice(0, 20);
        for (const line of lines) {
            const commentMatch = line.match(/^\s*(?:\/\/|#)\s*@(\w+)\s+(.+)$/);
            if (commentMatch) {
                const [, key, value] = commentMatch;
                switch (key?.toLowerCase()) {
                    case 'name':
                        metadata.name = value?.trim() || defaultName;
                        break;
                    case 'description':
                        metadata.description = value?.trim() || '';
                        break;
                    case 'author':
                        metadata.author = value?.trim() || 'Unknown';
                        break;
                    case 'tags':
                        metadata.tags = value?.split(',').map(t => t.trim()) || [];
                        break;
                }
            }
        }
        return metadata;
    }
    async loadMetadata(workflowDir) {
        try {
            const manifestPath = path.join(workflowDir, 'workflow.json');
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            const manifest = JSON.parse(manifestContent);
            const stats = await fs.stat(workflowDir);
            const relativePath = path.relative(this.basePath, workflowDir);
            const id = this.generateId(relativePath, manifest.name);
            const files = await fs.readdir(workflowDir);
            const hasAttachments = files.some(file => file !== manifest.mainFile && file !== 'workflow.json');
            return {
                id,
                name: manifest.name,
                description: manifest.description,
                author: manifest.author,
                tags: manifest.tags,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                path: this.normalizePath(relativePath),
                hasAttachments,
                mainFile: manifest.mainFile,
            };
        }
        catch {
            return null;
        }
    }
    async saveManifest(workflowDir, metadata) {
        const manifest = {
            name: metadata.name,
            description: metadata.description,
            author: metadata.author,
            tags: [...metadata.tags],
            mainFile: metadata.mainFile,
        };
        const manifestPath = path.join(workflowDir, 'workflow.json');
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    }
    async findWorkflowById(id) {
        const workflows = await this.list();
        return workflows.find(w => w.id === id) || null;
    }
    async loadAttachments(workflowPath) {
        if (workflowPath.endsWith('.xxp') || workflowPath.endsWith('.espace')) {
            return [];
        }
        const workflowDir = path.join(this.basePath, workflowPath);
        const attachments = [];
        try {
            const files = await fs.readdir(workflowDir);
            const manifest = await this.loadMetadata(workflowDir);
            if (!manifest) {
                return attachments;
            }
            for (const file of files) {
                if (file !== manifest.mainFile && file !== 'workflow.json') {
                    const filePath = path.join(workflowDir, file);
                    const stats = await fs.stat(filePath);
                    if (stats.isFile()) {
                        attachments.push({
                            name: file,
                            path: this.normalizePath(path.join(workflowPath, file)),
                            size: stats.size,
                            mimeType: this.getMimeType(file),
                            createdAt: stats.birthtime,
                            modifiedAt: stats.mtime,
                        });
                    }
                }
            }
        }
        catch {
        }
        return attachments;
    }
    filterWorkflows(workflows, options) {
        let filtered = [...workflows];
        if (options.query) {
            const query = options.query.toLowerCase();
            filtered = filtered.filter(w => w.name.toLowerCase().includes(query) ||
                w.description.toLowerCase().includes(query) ||
                w.tags.some(tag => tag.toLowerCase().includes(query)));
        }
        if (options.author) {
            filtered = filtered.filter(w => w.author.toLowerCase().includes(options.author.toLowerCase()));
        }
        if (options.tags && options.tags.length > 0) {
            filtered = filtered.filter(w => options.tags.some(tag => w.tags.some(wTag => wTag.toLowerCase() === tag.toLowerCase())));
        }
        if (options.path) {
            filtered = filtered.filter(w => w.path.startsWith(options.path));
        }
        if (options.offset) {
            filtered = filtered.slice(options.offset);
        }
        if (options.limit) {
            filtered = filtered.slice(0, options.limit);
        }
        return filtered;
    }
    async buildTreeNode(dirPath, relativePath) {
        const name = relativePath === '' ? 'Repository' : path.basename(dirPath);
        const children = [];
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile() && (entry.name.endsWith('.xxp') || entry.name.endsWith('.espace'))) {
                    const filePath = path.join(dirPath, entry.name);
                    const relPath = path.join(relativePath, entry.name);
                    const metadata = await this.loadSingleFileWorkflow(filePath, relPath);
                    if (metadata) {
                        children.push({
                            name: entry.name,
                            path: this.normalizePath(relPath),
                            type: 'workflow',
                            metadata,
                        });
                    }
                }
            }
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const childRelativePath = path.join(relativePath, entry.name);
                if (entry.isDirectory()) {
                    const manifestPath = path.join(fullPath, 'workflow.json');
                    try {
                        await fs.access(manifestPath);
                        const metadata = await this.loadMetadata(fullPath);
                        if (metadata) {
                            children.push({
                                name: entry.name,
                                path: this.normalizePath(childRelativePath),
                                type: 'workflow',
                                metadata,
                            });
                        }
                    }
                    catch {
                        const childNode = await this.buildTreeNode(fullPath, childRelativePath);
                        if (childNode.children && childNode.children.length > 0) {
                            children.push(childNode);
                        }
                    }
                }
            }
        }
        catch {
        }
        return {
            name,
            path: this.normalizePath(relativePath),
            type: 'folder',
            children: children.length > 0 ? children : [],
        };
    }
    generateId(workflowPath, name) {
        const input = `${workflowPath}/${name}`.replace(/\\/g, '/');
        return createHash('sha256').update(input).digest('hex').substring(0, 16);
    }
    normalizePath(pathStr) {
        return pathStr.replace(/\\/g, '/');
    }
    sanitizeFileName(name) {
        return name
            .replace(/[<>:"/\\|?*]/g, '-')
            .replace(/\s+/g, '_')
            .replace(/\.+$/, '')
            .substring(0, 255);
    }
    getMimeType(fileName) {
        const ext = path.extname(fileName).toLowerCase();
        const mimeTypes = {
            '.py': 'text/x-python',
            '.js': 'application/javascript',
            '.ts': 'application/typescript',
            '.json': 'application/json',
            '.txt': 'text/plain',
            '.md': 'text/markdown',
            '.csv': 'text/csv',
            '.xml': 'application/xml',
            '.yaml': 'application/x-yaml',
            '.yml': 'application/x-yaml',
            '.xxp': 'application/x-xxp',
            '.espace': 'application/x-espace',
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
}
//# sourceMappingURL=LocalWorkflowRepository.js.map