import * as path from 'path';
import * as fs from 'fs';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentType } from '../core/types/DocumentType.js';
import { URI } from 'vscode-uri';

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
      const normalizedPath = this.normalizeFileUri(filePath);
      return fs.existsSync(normalizedPath);
    } catch {
      return false;
    }
  }

  public static validateFilePath(filePath: string): string {
    const cleanPath =
      filePath.startsWith('"') && filePath.endsWith('"')
        ? filePath.substring(1, filePath.length - 1)
        : filePath;

    // Don't validate existence for relative paths during parsing
    // The actual resolution should happen at runtime
    if (!path.isAbsolute(cleanPath)) {
      return cleanPath;
    }

    if (!this.fileExists(cleanPath)) {
      throw new Error(`File does not exist: ${cleanPath}`);
    }

    return cleanPath;
  }

  public static normalizeFileUri(uri: string): string {
    try {
      // Use vscode-uri for proper URI parsing
      const parsed = URI.parse(uri);
      if (parsed.scheme === 'file') {
        return parsed.fsPath;
      }
      return uri;
    } catch {
      // Fallback for non-URI paths
      return uri;
    }
  }

  public static resolveRelativePath(basePath: string, relativePath: string): string {
    const baseDir = path.dirname(this.normalizeFileUri(basePath));
    return path.resolve(baseDir, relativePath);
  }

  public static getRelativePath(from: string, to: string): string {
    const fromPath = this.normalizeFileUri(from);
    const toPath = this.normalizeFileUri(to);
    return path.relative(path.dirname(fromPath), toPath);
  }
}
