import { promisify } from 'util';
import { DocumentType } from '../core/models/DocumentType.js';
import * as path from 'path';
import * as fs from 'fs';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Logger } from './Logger.js';
import { StringUtils } from './StringUtils.js';
const readFileAsync = promisify(fs.readFile);
export class FileUtils {
    static getFolderPath(uri) {
        const normalizedPath = this.normalizeFileUri(uri);
        return path.dirname(normalizedPath);
    }
    static logger = Logger.getLogger();
    static getDocumentType(uri) {
        const ext = path.extname(uri).toLowerCase().replace('.', '');
        switch (ext) {
            case 'xxp':
                return DocumentType.XXP;
            case 'espace':
                return DocumentType.ESPACE;
            default:
                return undefined;
        }
    }
    static getFileName(uri) {
        return path.basename(uri);
    }
    static getWorkflowFileFromWorkflowName(workflowName) {
        return `${workflowName.charAt(0).toLowerCase()}${workflowName.slice(1)}.xxp`;
    }
    static readTextDocumentAsync(filepath) {
        const normalizedPath = this.normalizeFileUri(filepath);
        try {
            const content = fs.readFileSync(normalizedPath, 'utf8');
            return TextDocument.create(filepath, path.extname(filepath).slice(1), 0, content);
        }
        catch (error) {
            this.logger.error(`Failed to read file: ${normalizedPath}: ${error}`);
            return undefined;
        }
    }
    static getFileInformation(filePath) {
        const normalizedPath = path.normalize(filePath);
        if (!fs.existsSync(normalizedPath)) {
            throw new Error(`File ${filePath} does not exist`);
        }
        const stats = fs.statSync(normalizedPath);
        return {
            name: path.basename(filePath),
            size: stats.size,
            modificationTime: stats.mtime,
            creationTime: stats.birthtime,
        };
    }
    static validateFilePath(filePath) {
        const cleanPath = filePath.startsWith('file://')
            ? filePath.substring(7)
            : StringUtils.removeDoubleQuotes(filePath);
        try {
            this.getFileInformation(cleanPath);
            return cleanPath;
        }
        catch (error) {
            throw error;
        }
    }
    static normalizeFileUri(uri) {
        if (uri.startsWith('file:///')) {
            return decodeURIComponent(uri.slice(8).replace(/\//g, path.sep));
        }
        return uri;
    }
}
//# sourceMappingURL=FileUtils.js.map