import { Document } from '../documents/Document.js';
import { WorkflowSymbol } from '../symbols/WorkflowSymbol.js';
import { SpaceSymbol } from '../symbols/SpaceSymbol.js';
import { Logger } from '../../utils/Logger.js';

export class DependencyAnalyzer {
    private logger = Logger.getInstance();

    public analyzeDependencies(documents: Map<string, Document>): void {
        this.logger.info('Analyzing cross-document dependencies');

        for (const document of documents.values()) {
            this.analyzeDocumentDependencies(document, documents);
        }
    }

    private analyzeDocumentDependencies(document: Document, allDocuments: Map<string, Document>): void {
        if (!document.symbolTable) return;

        if (document.uri.endsWith('.xxp')) {
            this.analyzeWorkflowDependencies(document, allDocuments);
        } else if (document.uri.endsWith('.espace')) {
            this.analyzeExperimentDependencies(document, allDocuments);
        }
    }

    private analyzeWorkflowDependencies(document: Document, allDocuments: Map<string, Document>): void {
        const workflows = document.symbolTable!.getNestedSymbolsOfTypeSync(WorkflowSymbol);
        
        for (const workflow of workflows) {
            if (workflow.parentWorkflow) {
                // Dependency is already established during parsing
                continue;
            }
        }
    }

    private analyzeExperimentDependencies(document: Document, allDocuments: Map<string, Document>): void {
        const spaces = document.symbolTable!.getNestedSymbolsOfTypeSync(SpaceSymbol);
        
        for (const space of spaces) {
            const workflowDoc = this.findWorkflowDocument(space.workflowName, allDocuments);
            if (workflowDoc) {
                Document.addDocumentDependency(document, workflowDoc);
            }
        }
    }

    private findWorkflowDocument(workflowName: string, allDocuments: Map<string, Document>): Document | undefined {
        const expectedFilename = `${workflowName.toLowerCase()}.xxp`;
        
        for (const [uri, document] of allDocuments) {
            if (uri.endsWith(expectedFilename)) {
                return document;
            }
        }
        
        return undefined;
    }
}