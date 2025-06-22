import { Document } from '../documents/Document.js';
import { ValidationEngine } from '../validation/ValidationEngine.js';
import { DependencyAnalyzer } from './DependencyAnalyzer.js';
import { Logger } from '../../utils/Logger.js';

export class SemanticAnalyzer {
  private logger = Logger.getInstance();
  private validationEngine = new ValidationEngine();
  private dependencyAnalyzer = new DependencyAnalyzer();

  public analyzeDocuments(documents: Map<string, Document>): void {
    this.logger.info('Starting semantic analysis');

    // First pass: establish dependencies
    this.dependencyAnalyzer.analyzeDependencies(documents);

    // Second pass: validate documents
    for (const document of documents.values()) {
      this.validationEngine.validateDocument(document);
    }

    this.logger.info('Semantic analysis completed');
  }

  public analyzeDocument(document: Document): void {
    this.validationEngine.validateDocument(document);
  }
}
