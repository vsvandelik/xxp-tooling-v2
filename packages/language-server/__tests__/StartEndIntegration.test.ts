import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DocumentManager } from '../src/core/managers/DocumentsManager';
import { DocumentParser } from '../src/language/parsing/DocumentParser';
import { EspaceDocument } from '../src/core/documents/EspaceDocument';
import { XxpDocument } from '../src/core/documents/XxpDocument';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('START/END Control Flow Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'start-end-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should not flag START and END as undefined spaces', () => {
    // Create a workflow file
    const workflowContent = `workflow SimpleWorkflow {
    define task simpleTask {
        param value = 1;
        implement "echo test";
    }
}`;

    const workflowPath = path.join(tempDir, 'simpleWorkflow.xxp');
    fs.writeFileSync(workflowPath, workflowContent);

    // Create an experiment file that uses START and END
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

    const experimentPath = path.join(tempDir, 'experiment.espace');
    fs.writeFileSync(experimentPath, experimentContent);

    // Parse the workflow document first
    const workflowUri = `file:///${workflowPath.replace(/\\/g, '/')}`;
    const workflowTextDocument = TextDocument.create(workflowUri, 'xxp', 1, workflowContent);
    const documentsManager = new DocumentManager();
    const documentParser = new DocumentParser(documentsManager);
    const workflowDocument = new XxpDocument(workflowUri, documentParser);
    workflowDocument.updateDocument(workflowTextDocument);

    // Parse the experiment document
    const experimentUri = `file:///${experimentPath.replace(/\\/g, '/')}`;
    const experimentTextDocument = TextDocument.create(experimentUri, 'espace', 1, experimentContent);
    const experimentDocument = new EspaceDocument(experimentUri, documentParser);
    experimentDocument.updateDocument(experimentTextDocument);

    // Check diagnostics - there should be no START/END undefined errors
    const diagnostics = experimentDocument.diagnostics || [];
    
    const startEndErrors = diagnostics.filter(d => 
      d.message.includes("Space 'START' is not defined") || 
      d.message.includes("Space 'END' is not defined")
    );

    expect(startEndErrors).toHaveLength(0);

    // Verify that other space validations still work - if we had UndefinedSpace, it should still error
    const experimentWithError = experimentContent.replace('Set1 -> Set2;', 'Set1 -> UndefinedSpace;');
    const errorTextDocument = TextDocument.create(experimentUri, 'espace', 2, experimentWithError);
    const errorDocument = new EspaceDocument(experimentUri, documentParser);
    errorDocument.updateDocument(errorTextDocument);

    const errorDiagnostics = errorDocument.diagnostics || [];
    const undefinedSpaceErrors = errorDiagnostics.filter(d => 
      d.message.includes("Space 'UndefinedSpace' is not defined")
    );

    expect(undefinedSpaceErrors.length).toBeGreaterThan(0);
  });
});