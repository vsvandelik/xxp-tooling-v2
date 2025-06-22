import { TextDocument } from 'vscode-languageserver-textdocument';
import { Document } from '../documents/Document.js';
import { XxpDocument } from '../documents/XxpDocument.js';
import { EspaceDocument } from '../documents/EspaceDocument.js';
import { DocumentType } from '../types/DocumentType.js';
import { DocumentParser } from '../parsing/DocumentParser.js';
import { DocumentSymbolTable } from '../symbols/DocumentSymbolTable.js';
import { SemanticAnalyzer } from '../analysis/SemanticAnalyzer.js';
import { FileUtils } from '../../utils/FileUtils.js';
import { Logger } from '../../utils/Logger.js';

export class DocumentManager {
  private readonly parsedDocuments = new Map<string, Document>();
  private readonly folderSymbolTables = new Map<string, DocumentSymbolTable>();
  private readonly documentParser = new DocumentParser(this);
  private readonly semanticAnalyzer = new SemanticAnalyzer();
  private readonly logger = Logger.getInstance();

  public onDocumentOpened(document: TextDocument): void {
    this.logger.info(`Document opened: ${document.uri}`);
    this.parseAndUpdateDocument(document);
    this.runSemanticAnalysis();
  }

  public onDocumentChanged(document: TextDocument): void {
    this.logger.info(`Document changed: ${document.uri}`);
    this.parseAndUpdateDocument(document);
    this.runSemanticAnalysis();
  }

  public onDocumentClosed(document: TextDocument): void {
    this.logger.info(`Document closed: ${document.uri}`);

    const closedDocument = this.parsedDocuments.get(document.uri);
    if (closedDocument) {
      // Clean up dependencies
      this.cleanupDocumentDependencies(closedDocument);
    }

    this.parsedDocuments.delete(document.uri);
    this.cleanupUnusedSymbolTables();
  }

  private parseAndUpdateDocument(document: TextDocument): void {
    const existingDocument = this.parsedDocuments.get(document.uri);
    if (existingDocument) {
      existingDocument.updateDocument(document);
      return;
    }

    const newDocument = this.createDocument(document);
    if (newDocument) {
      this.parsedDocuments.set(document.uri, newDocument);
      newDocument.updateDocument(document);
    }
  }

  private createDocument(document: TextDocument): Document | undefined {
    const fileType = FileUtils.getDocumentType(document.uri);
    if (!fileType) {
      this.logger.warn(`Unknown file type for ${document.uri}`);
      return undefined;
    }

    switch (fileType) {
      case DocumentType.XXP:
        return new XxpDocument(document.uri, this.documentParser);
      case DocumentType.ESPACE:
        return new EspaceDocument(document.uri, this.documentParser);
      default:
        this.logger.warn(`Unsupported file type for ${document.uri}`);
        return undefined;
    }
  }

  public getDocument(uri: string): Document | undefined {
    return this.parsedDocuments.get(uri);
  }

  public getAllDocuments(): Map<string, Document> {
    return new Map(this.parsedDocuments);
  }

  public loadDocumentFromFileSystem(uri: string): Document | undefined {
    if (this.parsedDocuments.has(uri)) {
      return this.parsedDocuments.get(uri);
    }

    const textDocument = FileUtils.readTextDocument(uri);
    if (!textDocument) return undefined;

    const document = this.createDocument(textDocument);
    if (document) {
      this.parsedDocuments.set(uri, document);
      document.updateDocument(textDocument);
    }
    return document;
  }

  public getFolderSymbolTable(uri: string): DocumentSymbolTable {
    const folderPath = FileUtils.getFolderPath(uri);
    let symbolTable = this.folderSymbolTables.get(folderPath);

    if (!symbolTable) {
      symbolTable = new DocumentSymbolTable(folderPath);
      this.folderSymbolTables.set(folderPath, symbolTable);
    }

    return symbolTable;
  }

  private runSemanticAnalysis(): void {
    try {
      this.semanticAnalyzer.analyzeDocuments(this.parsedDocuments);
    } catch (error) {
      this.logger.error(`Error during semantic analysis: ${error}`);
    }
  }

  private cleanupDocumentDependencies(document: Document): void {
    // Remove this document from all dependencies
    for (const dependency of document.dependencies) {
      dependency.dependents.delete(document);
    }

    // Remove this document from all dependents
    for (const dependent of document.dependents) {
      dependent.dependencies.delete(document);
    }

    document.dependencies.clear();
    document.dependents.clear();
  }

  private cleanupUnusedSymbolTables(): void {
    const usedFolders = new Set<string>();

    for (const document of this.parsedDocuments.values()) {
      const folderPath = FileUtils.getFolderPath(document.uri);
      usedFolders.add(folderPath);
    }

    for (const [folderPath, symbolTable] of this.folderSymbolTables.entries()) {
      if (!usedFolders.has(folderPath)) {
        symbolTable.clear();
        this.folderSymbolTables.delete(folderPath);
      }
    }
  }
}
