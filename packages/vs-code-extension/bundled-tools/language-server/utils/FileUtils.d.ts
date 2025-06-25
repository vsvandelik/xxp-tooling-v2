import { DocumentType } from '../core/models/DocumentType.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { FileInfo } from '../core/models/FileInfo.js';
export declare class FileUtils {
    static getFolderPath(uri: string): any;
    private static logger;
    static getDocumentType(uri: string): DocumentType | undefined;
    static getFileName(uri: string): string;
    static getWorkflowFileFromWorkflowName(workflowName: string): string;
    static readTextDocumentAsync(filepath: string): TextDocument | undefined;
    static getFileInformation(filePath: string): FileInfo;
    static validateFilePath(filePath: string): string;
    private static normalizeFileUri;
}
//# sourceMappingURL=FileUtils.d.ts.map