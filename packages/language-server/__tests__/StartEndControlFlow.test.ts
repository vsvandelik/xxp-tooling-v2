import { describe, it, expect } from '@jest/globals';
import { DocumentManager } from '../src/core/managers/DocumentsManager';
import { DocumentParser } from '../src/language/parsing/DocumentParser';
import { EspaceDocument } from '../src/core/documents/EspaceDocument';
import { XxpDocument } from '../src/core/documents/XxpDocument';
import { TextDocument } from 'vscode-languageserver-textdocument';

describe('START/END Control Flow Support', () => {
  it('should not report START and END as undefined spaces in control flow', () => {
    const experimentContent = `experiment E1 {
    space Set1 of SimpleWorkflow {
        param value = 1;
    }

    space Set2 of SimpleWorkflow {
        param value = 2;
    }

    control {
        START -> Set1;
        Set1 -> Set2;
        Set2 -> END;
    }
}`;

    const workflowContent = `workflow SimpleWorkflow {
    define task SimpleTask {
        param value = 1;
        implement "echo test";
    }
}`;

    // Create document manager and parser
    const documentsManager = new DocumentManager();
    const documentParser = new DocumentParser(documentsManager);
    
    // Create workflow document first
    const workflowUri = 'file:///tmp/SimpleWorkflow.xxp';
    const workflowTextDocument = TextDocument.create(workflowUri, 'xxp', 1, workflowContent);
    const workflowDocument = new XxpDocument(workflowUri, documentParser);
    workflowDocument.updateDocument(workflowTextDocument);
    
    // Create experiment document
    const experimentUri = 'file:///tmp/test.espace';
    const experimentTextDocument = TextDocument.create(experimentUri, 'espace', 1, experimentContent);
    const experimentDocument = new EspaceDocument(experimentUri, documentParser);
    experimentDocument.updateDocument(experimentTextDocument);

    // Check diagnostics
    const diagnostics = experimentDocument.diagnostics || [];
    
    // Should not have any diagnostics about START/END being undefined
    const startEndDiagnostics = diagnostics.filter(d => 
      d.message.includes("Space 'START' is not defined") || 
      d.message.includes("Space 'END' is not defined")
    );
    
    expect(startEndDiagnostics).toHaveLength(0);
    
    // Should verify normal space validation still works
    const testInvalidSpace = experimentContent.replace('Set1 -> Set2;', 'Set1 -> InvalidSpace;');
    const invalidTextDocument = TextDocument.create(experimentUri, 'espace', 2, testInvalidSpace);
    const invalidDocument = new EspaceDocument(experimentUri, documentParser);
    invalidDocument.updateDocument(invalidTextDocument);
    
    const invalidDiagnostics = invalidDocument.diagnostics || [];
    const invalidSpaceDiagnostics = invalidDiagnostics.filter(d => 
      d.message.includes("Space 'InvalidSpace' is not defined")
    );
    
    expect(invalidSpaceDiagnostics.length).toBeGreaterThan(0);
  });
});