import * as path from 'path';
import * as fs from 'fs';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentType } from '../core/types/DocumentType.js';

export class FileUtils {
  public static getDocumentType(uri: string): DocumentType | undefined {
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

  public static getFileName(uri: string): string {
    return path.basename(uri);
  }

  public static getFolderPath(uri: string): string {
    const normalizedPath = this.normalizeFileUri(uri);
    return path.dirname(normalizedPath);
  }

  public static readTextDocument(uri: string): TextDocument | undefined {
    const normalizedPath = this.normalizeFileUri(uri);
    try {
      const content = fs.readFileSync(normalizedPath, 'utf8');
      return TextDocument.create(uri, path.extname(uri).slice(1), 0, content);
    } catch (error) {
      console.error(`Failed to read file: ${normalizedPath}: ${error}`);
      return undefined;
    }
  }

  public static fileExists(filePath: string): boolean {
    try {
      return fs.existsSync(this.normalizeFileUri(filePath));
    } catch {
      return false;
    }
  }

  public static validateFilePath(filePath: string): string {
    const cleanPath =
      filePath.startsWith('"') && filePath.endsWith('"')
        ? filePath.substring(1, filePath.length - 1)
        : filePath;

    if (!this.fileExists(cleanPath)) {
      throw new Error(`File does not exist: ${cleanPath}`);
    }

    return cleanPath;
  }

  private static normalizeFileUri(uri: string): string {
    if (uri.startsWith('file:///')) {
      return decodeURIComponent(uri.slice(8).replace(/\//g, path.sep));
    }
    return uri;
  }
}
