// Core managers - public API for external language server clients
export { DocumentManager } from './core/managers/DocumentsManager.js';
export { ProvidersManager } from './core/managers/ProvidersManager.js';
export { WorkspaceManager } from './core/managers/WorkspaceManager.js';

// Language parsing
export { DocumentParser } from './language/parsing/DocumentParser.js';
export { DocumentSymbolTable } from './language/symbolTable/DocumentSymbolTable.js';

// Document models
export { Document } from './core/documents/Document.js';
export { XxpDocument } from './core/documents/XxpDocument.js';
export { EspaceDocument } from './core/documents/EspaceDocument.js';
export { DocumentType } from './core/models/DocumentType.js';

// Utilities
export { Logger } from './utils/Logger.js';
export { FileUtils } from './utils/FileUtils.js';