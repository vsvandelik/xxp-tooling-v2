import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DocumentManager } from '../src/core/managers/DocumentsManager';
import { DocumentParser } from '../src/language/parsing/DocumentParser';
import { EspaceDocument } from '../src/core/documents/EspaceDocument';
import { XxpDocument } from '../src/core/documents/XxpDocument';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Problem Statement Verification', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'problem-verification-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle the exact sample from the problem statement without START/END errors', () => {
    // This is the exact sample file from the problem statement
    const experimentContent = `experiment E1 {
    space Set1 of ConcreteInheritedWorkflow {
        param trainingSetSize = range(100, 1000, 100);
        param hyperparameter = enum(0.5, 0.6, 0.9, 1.0, 1.5);

        configure task postProcessing {
            param threshold = 0.8;
        }
    }

    space Set2 of ConcreteInheritedWorkflow {
        param trainingSetSize = 50;
        param hyperparameter = range(0.1, 1.0, 0.1);
        param threshold = 0.8;
    }

    space Set3 of ConcreteInheritedWorkflow {
        configure task preProcessing {
            param trainingSetSize = enum(100, 200, 300);
        }

        configure task processing {
            param hyperparameter = 1.0;
        }

        configure task postProcessing {
            param threshold = range(0.5, 1.0, 0.1);
        }
    }

    control {
        START -> Set1;
        Set1 -?> Set2 {
            condition "input() == 'yes'";
        }
        Set1 -?> Set3 {
            condition "input() == 'no'";
        }
        Set2 -> END;
        Set3 -> END;
    }

    define data inputData = "data/inputData.csv"; 
}`;

    const workflowContent = `workflow ConcreteInheritedWorkflow {
    define task preProcessing {
        param trainingSetSize = 100;
        implement "python scripts/preprocessing.py";
    }

    define task processing {
        param hyperparameter = 1.0;
        implement "python scripts/processing.py";
    }

    define task postProcessing {
        param threshold = 0.5;
        implement "python scripts/postprocessing.py";
    }
}`;

    const workflowPath = path.join(tempDir, 'concreteInheritedWorkflow.xxp');
    fs.writeFileSync(workflowPath, workflowContent);

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

    // Verify there are NO START/END undefined errors - this was the original problem
    const diagnostics = experimentDocument.diagnostics || [];
    
    const startEndErrors = diagnostics.filter(d => 
      d.message.includes("Space 'START' is not defined") || 
      d.message.includes("Space 'END' is not defined")
    );

    expect(startEndErrors).toHaveLength(0);

    // Log all diagnostics for debugging if needed
    console.log('Diagnostics found:', diagnostics.map(d => d.message));
  });
});