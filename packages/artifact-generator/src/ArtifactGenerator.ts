import { ArtifactModel } from './models/ArtifactModel.js';
import { ExperimentModel } from './models/ExperimentModel.js';
import { WorkflowModel } from './models/WorkflowModel.js';
import { ExperimentParser } from './parsers/ExperimentParser.js';

export interface ArtifactGeneratorOptions {
  verbose?: boolean;
  workflowDirectory?: string;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export class ArtifactGenerator {
  private verbose = false;
  private experimentParser = new ExperimentParser();
  /*private workflowParser = new WorkflowParser();
    private fileResolver = new FileResolver();*/

  constructor(options: ArtifactGeneratorOptions) {
    this.verbose = options.verbose || false;
  }

  async generate(espaceFilePath: string): Promise<ArtifactModel> {
    console.log(`Generating artifact from: ${espaceFilePath}`);

    return {};
  }

  async validate(espaceFilePath: string): Promise<ValidationResult> {
    const validationResult: ValidationResult = {
      errors: [],
      warnings: [],
    };

    await this.parseFiles(espaceFilePath);

    return validationResult;
  }

  private async parseFiles(
    espaceFilePath: string
  ): Promise<{ experiment: ExperimentModel; workflows: WorkflowModel[] }> {
    if (this.verbose) {
      console.log(`Parsing experiment file: ${espaceFilePath}`);
    }

    const experiment = await this.experimentParser.parse(espaceFilePath);
    const workflowNames = experiment.spaces.map(space => space.workflowName);
    const uniqueWorkflowNames = [...new Set(workflowNames)];

    console.log(`Found workflows: ${uniqueWorkflowNames.join(', ')}`);

    const workflows: WorkflowModel[] = [];

    /*for (const workflowName of uniqueWorkflowNames) {
        const workflowFiles = await this.fileResolver.findWorkflowFiles(workflowName);
        
        for (const workflowFile of workflowFiles) {
            if (this.verbose) {
            console.log(`Parsing workflow file: ${workflowFile}`);
            }
            const workflow = await this.workflowParser.parse(workflowFile);
            workflows.push(workflow);
        }
        }*/

    return { experiment, workflows };
  }
}
