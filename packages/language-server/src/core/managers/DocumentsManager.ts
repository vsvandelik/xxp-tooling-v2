import { TextDocument } from 'vscode-languageserver-textdocument';
import { Logger } from '../../utils/Logger.js';
import { FileUtils } from '../../utils/FileUtils.js';
import { DocumentParser } from '../../language/parsing/DocumentParser.js';
import { DocumentSymbolTable } from '../../language/symbolTable/DocumentSymbolTable.js';
import { XxpDocument } from '../documents/XxpDocument.js';
import { EspaceDocument } from '../documents/EspaceDocument.js';
import { DocumentType } from '../models/DocumentType.js';
import { Document } from '../documents/Document.js';

export class DocumentManager {
  private readonly parsedDocuments = new Map<string, Document>();
  private readonly symbolTablesBasedOnFolders = new Map<string, DocumentSymbolTable>();
  private readonly logger = Logger.getLogger();
  private readonly documentParser = new DocumentParser(this);

  public async onDocumentOpened(document: TextDocument): Promise<void> {
    this.logger.info(`Document opened: ${document.uri}`);
    this.parseAndUpdateDocument(document);
  }

  public async onDocumentChanged(document: TextDocument): Promise<void> {
    this.logger.info(`Document changed: ${document.uri}`);
    this.parseAndUpdateDocument(document);
  }

  public async onDocumentSaved(document: TextDocument): Promise<void> {
    this.logger.info(`Document saved: ${document.uri}`);
  }

  public onDocumentClosed(document: TextDocument): void {
    this.logger.info(`Document closed: ${document.uri}`);
    
    // Get the document before removing it from cache
    const cachedDocument = this.parsedDocuments.get(document.uri);
    
    // Remove from document cache
    this.parsedDocuments.delete(document.uri);
    
    // Clean up document dependencies if document was cached
    if (cachedDocument) {
      this.cleanupDocumentDependencies(cachedDocument);
      
      // Clean up symbols from folder symbol table
      this.cleanupDocumentSymbols(document.uri, cachedDocument);
    }
  }

  private parseAndUpdateDocument(document: TextDocument): void {
    const existingDocument = this.parsedDocuments.get(document.uri);
    if (existingDocument) {
      this.refreshDocument(document, existingDocument);
      this.unloadUnnecessaryDocuments();
      return;
    }

    const newDocument = this.addNewDocument(document);
    newDocument?.updateDocument(document);

    this.unloadUnnecessaryDocuments();
  }

  private refreshDocument(document: TextDocument, existingDocument: Document): void {
    existingDocument.updateDocument(document);
    this.logger.info(`Document updated in cache: ${document.uri}`);
  }

  private addNewDocument(document: TextDocument): Document | undefined {
    const fileType = FileUtils.getDocumentType(document.uri);
    if (!fileType) {
      this.logger.warn(`Unknown file type for ${document.uri}`);
      return;
    }

    let newDocument: Document;
    switch (fileType) {
      case DocumentType.XXP:
        newDocument = new XxpDocument(document.uri, this.documentParser);
        break;
      case DocumentType.ESPACE:
        newDocument = new EspaceDocument(document.uri, this.documentParser);
        break;
      default:
        this.logger.warn(`Unsupported file type for ${document.uri}`);
        return;
    }

    this.parsedDocuments.set(document.uri, newDocument);
    return newDocument;
  }

  private cleanupDocumentDependencies(document: Document): void {
    // Clean up document dependencies
    for (const dependingDoc of document.documentsDependingOnThis) {
      dependingDoc.documentsThisDependsOn.delete(document);
    }
    for (const dependsOnDoc of document.documentsThisDependsOn) {
      dependsOnDoc.documentsDependingOnThis.delete(document);
    }
    
    // Clear the dependency sets
    document.documentsDependingOnThis.clear();
    document.documentsThisDependsOn.clear();
  }

  private cleanupDocumentSymbols(uri: string, document: Document): void {
    const folderPath = FileUtils.getFolderPath(uri);
    const folderSymbolTable = this.symbolTablesBasedOnFolders.get(folderPath);
    
    if (!folderSymbolTable) {
      return;
    }
    
    // Check if there are any other documents still open in this folder
    const documentsInFolder = this.getDocumentsInFolder(folderPath);
    
    if (documentsInFolder.length === 0) {
      // No more documents in this folder, clear the entire symbol table
      this.logger.info(`Clearing symbol table for folder: ${folderPath}`);
      folderSymbolTable.clear();
    }
  }

  private getDocumentsInFolder(folderPath: string): Document[] {
    const documentsInFolder: Document[] = [];
    for (const [uri, document] of this.parsedDocuments.entries()) {
      if (FileUtils.getFolderPath(uri) === folderPath) {
        documentsInFolder.push(document);
      }
    }
    return documentsInFolder;
  }

  public getDocument(uri: string): Document | undefined {
    const document = this.parsedDocuments.get(uri);
    if (!document) {
      this.logger.warn(`Document not found in cache: ${uri}`);
    }
    return document;
  }

  public getDocumentAndLoadIfNecessary(uri: string): Document | undefined {
    if (!this.parsedDocuments.has(uri)) {
      console.log(`Loading document from file system: ${uri}`);
      this.logger.warn(`Document not found in cache: ${uri}`);
      return this.loadDocumentDirectlyWithFileSystem(uri);
    }

    return this.parsedDocuments.get(uri);
  }

  public getDocumentSymbolTableForFile(uri: string): DocumentSymbolTable {
    const folderPath = FileUtils.getFolderPath(uri);
    let symbolTable = this.symbolTablesBasedOnFolders.get(folderPath);
    if (!symbolTable) {
      symbolTable = new DocumentSymbolTable(folderPath);
      this.symbolTablesBasedOnFolders.set(folderPath, symbolTable);
    }
    return symbolTable;
  }

  private unloadUnnecessaryDocuments(): void {
    for (const [uri, document] of this.parsedDocuments.entries()) {
      if (!document.forcedFsParsing) continue;

      let shouldUnload = true;
      for (const dependingDocument of document.documentsDependingOnThis) {
        if (dependingDocument.documentsThisDependsOn.has(document)) {
          shouldUnload = false;
          break;
        }
      }

      if (!shouldUnload) continue;
      this.logger.info(`Unloading unnecessary document: ${uri}`);
      this.parsedDocuments.delete(uri);
      // Fix: Get symbol table by folder path, not URI
      const folderPath = FileUtils.getFolderPath(uri);
      const symbolTable = this.symbolTablesBasedOnFolders.get(folderPath);
      symbolTable?.clear();
    }
  }

  private loadDocumentDirectlyWithFileSystem(uri: string): Document | undefined {
    const content = FileUtils.readTextDocumentAsync(uri);
    if (!content) {
      this.logger.error(`Failed to read file: ${uri}`);
      return undefined;
    }

    const newDocument = this.addNewDocument(content);
    if (!newDocument) {
      this.logger.error(`Failed to create document from file: ${uri}`);
      return undefined;
    }

    newDocument.forcedFsParsing = true;
    newDocument.updateDocument(content);
    this.logger.info(`Document loaded from file system: ${uri}`);

    return newDocument;
  }
}
