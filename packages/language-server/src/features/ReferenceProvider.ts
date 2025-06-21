// packages/language-server/src/features/ReferenceProvider.ts
import { ReferenceParams, Location } from 'vscode-languageserver/node';
import { DocumentManager } from '../documents/DocumentManager.js';
import { ASTUtils } from '../utils/ASTUtils.js';

export class ReferenceProvider {
  constructor(private documentManager: DocumentManager) {}

  async provideReferences(params: ReferenceParams): Promise<Location[] | null> {
    const document = this.documentManager.getDocument(params.textDocument.uri);
    if (!document || !document.parseTree) return null;

    const position = params.position;
    const includeDeclaration = params.context.includeDeclaration;

    // Find the node at the current position
    const node = this.documentManager.getNodeAtPosition(
      params.textDocument.uri,
      position.line,
      position.character
    );

    if (!node) return null;

    // Determine what symbol we're looking for references to
    const symbolInfo = ASTUtils.getSymbolInfo(node, document.languageId);
    if (!symbolInfo) return null;

    const symbolTable = this.documentManager.getSymbolTable();
    const references = symbolTable.getReferences(symbolInfo.name, symbolInfo.type);

    const locations: Location[] = [];
    for (const reference of references) {
      // Skip the declaration if not requested
      // TODO: implement proper isDefinition check
      // if (!includeDeclaration && reference.isDefinition) {
      //   continue;
      // }

      locations.push({
        uri: reference.uri,
        range: reference.range,
      });
    }

    return locations.length > 0 ? locations : null;
  }

  async findWorkflowReferences(workflowName: string): Promise<Location[]> {
    const locations: Location[] = [];
    const documents = this.documentManager.getAllDocuments();

    for (const doc of documents) {
      if (!doc.analysis) continue; // In XXP files: look for workflow inheritance
      if (doc.languageId === 'xxp' && doc.analysis.workflow) {
        if (
          doc.analysis.workflow.parentWorkflow === workflowName &&
          doc.analysis.workflow.parentWorkflowRange
        ) {
          locations.push({
            uri: doc.uri,
            range: doc.analysis.workflow.parentWorkflowRange,
          });
        }
      }

      // In ESPACE files: look for space declarations
      if (doc.languageId === 'espace' && doc.analysis.experiment) {
        for (const space of doc.analysis.experiment.spaces) {
          if (space.workflowName === workflowName) {
            locations.push({
              uri: doc.uri,
              range: space.workflowNameRange,
            });
          }
        }
      }
    }

    return locations;
  }

  async findTaskReferences(taskName: string, workflowName?: string): Promise<Location[]> {
    const locations: Location[] = [];
    const documents = this.documentManager.getAllDocuments();

    for (const doc of documents) {
      if (!doc.analysis) continue;

      // In XXP files: look in task chains and configurations
      if (doc.languageId === 'xxp' && doc.analysis.workflow) {
        // Task chain references
        if (doc.analysis.workflow.taskChain) {
          const chainRefs = doc.analysis.workflow.taskChain.elements
            .filter(e => e === taskName)
            .map(e => doc.analysis?.workflow?.taskChain?.elementRanges[e])
            .filter(r => r !== undefined);

          for (const range of chainRefs) {
            if (range) {
              locations.push({ uri: doc.uri, range });
            }
          }
        }

        // Input/output references
        for (const task of doc.analysis.workflow.tasks) {
          // Check if this task references our task through data dependencies
          if (this.hasDataDependency(task, taskName, doc.analysis.workflow)) {
            locations.push({
              uri: doc.uri,
              range: task.nameRange,
            });
          }
        }
      }

      // In ESPACE files: look in task configurations
      if (doc.languageId === 'espace' && doc.analysis.experiment) {
        for (const space of doc.analysis.experiment.spaces) {
          // Skip if workflow doesn't match
          if (workflowName && space.workflowName !== workflowName) {
            continue;
          }

          for (const taskConfig of space.taskConfigurations) {
            if (taskConfig.taskName === taskName) {
              locations.push({
                uri: doc.uri,
                range: taskConfig.taskNameRange,
              });
            }
          }
        }
      }
    }

    return locations;
  }

  async findParameterReferences(
    paramName: string,
    taskName?: string,
    workflowName?: string
  ): Promise<Location[]> {
    const locations: Location[] = [];
    const documents = this.documentManager.getAllDocuments();

    for (const doc of documents) {
      if (!doc.analysis) continue;

      // In ESPACE files: look for parameter definitions and overrides
      if (doc.languageId === 'espace' && doc.analysis.experiment) {
        for (const space of doc.analysis.experiment.spaces) {
          // Skip if workflow doesn't match
          if (workflowName && space.workflowName !== workflowName) {
            continue;
          }

          // Space-level parameters
          for (const param of space.parameters) {
            if (param.name === paramName) {
              locations.push({
                uri: doc.uri,
                range: param.nameRange,
              });
            }
          }

          // Task configuration parameters
          for (const taskConfig of space.taskConfigurations) {
            if (taskName && taskConfig.taskName !== taskName) {
              continue;
            }

            for (const param of taskConfig.parameters) {
              if (param.name === paramName) {
                locations.push({
                  uri: doc.uri,
                  range: param.nameRange,
                });
              }
            }
          }
        }
      }
    }

    return locations;
  }

  async findDataReferences(dataName: string): Promise<Location[]> {
    const locations: Location[] = [];
    const documents = this.documentManager.getAllDocuments();

    for (const doc of documents) {
      if (!doc.analysis) continue;

      // In XXP files: look for data usage in tasks
      if (doc.languageId === 'xxp' && doc.analysis.workflow) {
        for (const task of doc.analysis.workflow.tasks) {
          // Input references
          if (task.inputs.includes(dataName)) {
            const range = task.inputRanges?.[dataName];
            if (range) {
              locations.push({ uri: doc.uri, range });
            }
          }

          // Output references
          if (task.outputs.includes(dataName)) {
            const range = task.outputRanges?.[dataName];
            if (range) {
              locations.push({ uri: doc.uri, range });
            }
          }
        }
      }

      // In ESPACE files: look for data definitions
      if (doc.languageId === 'espace' && doc.analysis.experiment) {
        // Experiment-level data definitions
        for (const data of doc.analysis.experiment.dataDefinitions) {
          if (data.name === dataName && data.valueRange) {
            locations.push({
              uri: doc.uri,
              range: data.valueRange,
            });
          }
        }

        // Space-level data definitions
        for (const space of doc.analysis.experiment.spaces) {
          for (const data of space.dataDefinitions || []) {
            if (data.name === dataName && data.valueRange) {
              locations.push({
                uri: doc.uri,
                range: data.valueRange,
              });
            }
          }
        }
      }
    }

    return locations;
  }

  private hasDataDependency(task: any, targetTaskName: string, workflow: any): boolean {
    // Check if task depends on outputs from targetTask
    const targetTask = workflow.tasks.find((t: any) => t.name === targetTaskName);
    if (!targetTask) return false;

    // Check if any of task's inputs are produced by targetTask
    for (const input of task.inputs) {
      if (targetTask.outputs.includes(input)) {
        return true;
      }
    }

    return false;
  }
}
