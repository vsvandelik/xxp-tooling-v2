import { Logger } from '../../utils/Logger.js';
import { FileUtils } from '../../utils/FileUtils.js';
import { DocumentParser } from '../../language/parsing/DocumentParser.js';
import { DocumentSymbolTable } from '../../language/symbolTable/DocumentSymbolTable.js';
import { XxpDocument } from '../documents/XxpDocument.js';
import { EspaceDocument } from '../documents/EspaceDocument.js';
import { DocumentType } from '../models/DocumentType.js';
import { BaseSymbol } from 'antlr4-c3';
export class DocumentManager {
    parsedDocuments = new Map();
    symbolTablesBasedOnFolders = new Map();
    logger = Logger.getLogger();
    documentParser = new DocumentParser(this);
    async onDocumentOpened(document) {
        this.logger.info(`Document opened: ${document.uri}`);
        this.parseAndUpdateDocument(document);
    }
    async onDocumentChanged(document) {
        this.logger.info(`Document changed: ${document.uri}`);
        this.parseAndUpdateDocument(document);
    }
    async onDocumentSaved(document) {
        this.logger.info(`Document saved: ${document.uri}`);
    }
    onDocumentClosed(document) {
        this.logger.info(`Document closed: ${document.uri}`);
        const cachedDocument = this.parsedDocuments.get(document.uri);
        this.parsedDocuments.delete(document.uri);
        if (cachedDocument) {
            this.cleanupDocumentDependencies(cachedDocument);
            this.cleanupDocumentSymbols(document.uri, cachedDocument);
        }
    }
    parseAndUpdateDocument(document) {
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
    refreshDocument(document, existingDocument) {
        existingDocument.updateDocument(document);
        this.logger.info(`Document updated in cache: ${document.uri}`);
    }
    addNewDocument(document) {
        const fileType = FileUtils.getDocumentType(document.uri);
        if (!fileType) {
            this.logger.warn(`Unknown file type for ${document.uri}`);
            return;
        }
        let newDocument;
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
    cleanupDocumentDependencies(document) {
        for (const dependingDoc of document.documentsDependingOnThis) {
            dependingDoc.documentsThisDependsOn.delete(document);
        }
        for (const dependsOnDoc of document.documentsThisDependsOn) {
            dependsOnDoc.documentsDependingOnThis.delete(document);
        }
        document.documentsDependingOnThis.clear();
        document.documentsThisDependsOn.clear();
    }
    cleanupDocumentSymbols(uri, document) {
        const folderPath = FileUtils.getFolderPath(uri);
        const folderSymbolTable = this.symbolTablesBasedOnFolders.get(folderPath);
        if (!folderSymbolTable) {
            return;
        }
        this.removeDocumentSymbolsFromTable(folderSymbolTable, document);
        const documentsInFolder = this.getDocumentsInFolder(folderPath);
        if (documentsInFolder.length === 0) {
            this.logger.info(`Clearing symbol table for folder: ${folderPath}`);
            folderSymbolTable.clear();
        }
    }
    removeDocumentSymbolsFromTable(symbolTable, document) {
        const allSymbols = symbolTable.getAllSymbolsSync(BaseSymbol);
        const symbolsToRemove = [];
        for (const symbol of allSymbols) {
            if (this.symbolBelongsToDocument(symbol, document)) {
                symbolsToRemove.push(symbol);
            }
        }
        for (const symbol of symbolsToRemove) {
            this.logger.info(`Removing symbol '${symbol.name}' from folder symbol table (belonged to ${document.uri})`);
            symbolTable.removeSymbol(symbol);
        }
    }
    symbolBelongsToDocument(symbol, document) {
        if ('document' in symbol && symbol.document) {
            const symbolDocument = symbol.document;
            return symbolDocument.uri === document.uri;
        }
        return false;
    }
    getDocumentsInFolder(folderPath) {
        const documentsInFolder = [];
        for (const [uri, document] of this.parsedDocuments.entries()) {
            if (FileUtils.getFolderPath(uri) === folderPath) {
                documentsInFolder.push(document);
            }
        }
        return documentsInFolder;
    }
    getDocument(uri) {
        const document = this.parsedDocuments.get(uri);
        if (!document) {
            this.logger.warn(`Document not found in cache: ${uri}`);
        }
        return document;
    }
    getDocumentAndLoadIfNecessary(uri) {
        if (!this.parsedDocuments.has(uri)) {
            console.log(`Loading document from file system: ${uri}`);
            this.logger.warn(`Document not found in cache: ${uri}`);
            return this.loadDocumentDirectlyWithFileSystem(uri);
        }
        return this.parsedDocuments.get(uri);
    }
    getDocumentSymbolTableForFile(uri) {
        const folderPath = FileUtils.getFolderPath(uri);
        let symbolTable = this.symbolTablesBasedOnFolders.get(folderPath);
        if (!symbolTable) {
            symbolTable = new DocumentSymbolTable(folderPath);
            this.symbolTablesBasedOnFolders.set(folderPath, symbolTable);
        }
        return symbolTable;
    }
    unloadUnnecessaryDocuments() {
        for (const [uri, document] of this.parsedDocuments.entries()) {
            if (!document.forcedFsParsing)
                continue;
            let shouldUnload = true;
            for (const dependingDocument of document.documentsDependingOnThis) {
                if (dependingDocument.documentsThisDependsOn.has(document)) {
                    shouldUnload = false;
                    break;
                }
            }
            if (!shouldUnload)
                continue;
            this.logger.info(`Unloading unnecessary document: ${uri}`);
            this.parsedDocuments.delete(uri);
            const folderPath = FileUtils.getFolderPath(uri);
            const symbolTable = this.symbolTablesBasedOnFolders.get(folderPath);
            symbolTable?.clear();
        }
    }
    loadDocumentDirectlyWithFileSystem(uri) {
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
//# sourceMappingURL=DocumentsManager.js.map