import * as fs from 'fs';
import * as path from 'path';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { DocumentType } from '../core/models/DocumentType.js';
import { FileInfo } from '../core/models/FileInfo.js';

import { Logger } from './Logger.js';
import { StringUtils } from './StringUtils.js';

export class FileUtils {
  static getFolderPath(uri: string): any {
    const normalizedPath = this.normalizeFileUri(uri);
    return path.dirname(normalizedPath);
  }
  private static logger = Logger.getLogger();

  static getDocumentType(uri: string): DocumentType | undefined {
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

  static getFileName(uri: string): string {
    return path.basename(uri);
  }

  static getWorkflowFileFromWorkflowName(workflowName: string): string {
    return `${workflowName.charAt(0).toLowerCase()}${workflowName.slice(1)}.xxp`;
  }

  static readTextDocumentAsync(filepath: string): TextDocument | undefined {
    const normalizedPath = this.normalizeFileUri(filepath);
    try {
      const content = fs.readFileSync(normalizedPath, 'utf8');
      return TextDocument.create(filepath, path.extname(filepath).slice(1), 0, content);
    } catch (error) {
      this.logger.error(`Failed to read file: ${normalizedPath}: ${error}`);
      return undefined;
    }
  }

  static getFileInformation(filePath: string): FileInfo {
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

  static validateFilePath(filePath: string): string {
    // Remove quotes and handle file:// protocol
    const cleanPath = filePath.startsWith('file://')
      ? filePath.substring(7)
      : StringUtils.removeDoubleQuotes(filePath);

    // Validate file exists
    this.getFileInformation(cleanPath);
    return cleanPath;
  }

  private static normalizeFileUri(uri: string): string {
    if (uri.startsWith('file:///')) {
      return decodeURIComponent(uri.slice(7).replace(/\//g, path.sep));
    }
    return uri;
  }
}
