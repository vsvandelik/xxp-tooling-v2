import * as fs from 'fs';
import * as path from 'path';
import { workflowNameToFileName } from '@extremexp/core';
export class FileResolver {
    workflowDirectory;
    constructor(workflowDirectory) {
        this.workflowDirectory = path.resolve(workflowDirectory);
    }
    async findWorkflowFiles(workflowName) {
        const files = [];
        const visited = new Set();
        const findWorkflowRecursive = async (name) => {
            if (visited.has(name))
                return;
            visited.add(name);
            const filePath = path.join(this.workflowDirectory, workflowNameToFileName(name));
            if (!fs.existsSync(filePath)) {
                throw new Error(`Workflow file not found: ${filePath}`);
            }
            const content = fs.readFileSync(filePath, 'utf8');
            const parentMatch = content.match(/workflow\s+\w+\s+from\s+(\w+)/);
            if (parentMatch) {
                const parentName = parentMatch[1];
                await findWorkflowRecursive(parentName);
            }
            files.push(filePath);
        };
        await findWorkflowRecursive(workflowName);
        return files;
    }
    resolveDataPath(dataPath) {
        if (path.isAbsolute(dataPath)) {
            return dataPath;
        }
        return path.resolve(this.workflowDirectory, dataPath);
    }
    resolveImplementationPath(implementationPath) {
        if (path.isAbsolute(implementationPath)) {
            return implementationPath;
        }
        return path.resolve(this.workflowDirectory, implementationPath);
    }
}
//# sourceMappingURL=FileResolver.js.map