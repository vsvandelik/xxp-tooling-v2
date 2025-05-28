import { ArtifactModel } from '../models/ArtifactModel.js';
import { ExperimentModel } from '../models/ExperimentModel.js';
import { WorkflowModel } from '../models/WorkflowModel.js';
import { DataFlowResolver } from '../parsers/DataFlowResolver.js';
import { ExperimentParser } from '../parsers/ExperimentParser.js';
import { FileResolver } from '../resolvers/FileResolver.js';
import { ParameterResolver } from '../resolvers/ParameterResolver.js';
import { TaskResolver } from '../resolvers/TaskResolver.js';
import { WorkflowParser } from '../parsers/WorkflowParser.js';
import path from 'path';
import { ControlFlowGenerator } from './ControlFlowGenerator.js';
import { SpaceGenerator } from './SpaceGenerator.js';
import { TaskGenerator } from './TaskGenerator.js';

export interface ArtifactGeneratorOptions {
  verbose?: boolean;
  workflowDirectory?: string;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export interface ArtifactGeneratorOutput {
  artifact?: ArtifactModel;
  validation: ValidationResult;
}

export class ArtifactGenerator {
  private verbose = false;
  private experimentParser = new ExperimentParser();
  private workflowParser = new WorkflowParser();
  private fileResolver: FileResolver | undefined;
  private taskResolver = new TaskResolver();
  private parameterResolver = new ParameterResolver();
  private dataFlowResolver = new DataFlowResolver();
  private taskGenerator = new TaskGenerator();
  private spaceGenerator = new SpaceGenerator();
  private controlFlowGenerator = new ControlFlowGenerator();

  constructor(options: ArtifactGeneratorOptions) {
    this.verbose = options.verbose || false;
  }

  async generate(espaceFilePath: string): Promise<ArtifactGeneratorOutput> {
    if (this.verbose) {
      console.log(`Generating artifact from: ${espaceFilePath}`);
    }
    this.initializeFileResolver(espaceFilePath);

    const validation = await this.validate(espaceFilePath);

    if (validation.errors.length > 0) {
      return { validation };
    }

    const { experiment, workflows } = await this.parseFiles(espaceFilePath);

    const resolvedTasks = this.taskResolver.resolve(experiment, workflows);
    const resolvedParameters = this.parameterResolver.resolve(experiment);
    this.dataFlowResolver.validate(experiment, workflows, resolvedTasks);

    const tasks = this.taskGenerator.generate(resolvedTasks);
    const spaces = this.spaceGenerator.generate(experiment, resolvedParameters, resolvedTasks, this.taskResolver, workflows);
    const control = this.controlFlowGenerator.generate(experiment);

    const artifact = new ArtifactModel(experiment.name, '1.0', tasks, spaces, control);
    return { artifact, validation };
  }

  async validate(espaceFilePath: string): Promise<ValidationResult> {
    this.initializeFileResolver(espaceFilePath);

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const { experiment, workflows } = await this.parseFiles(espaceFilePath);

      // Validate workflow references
      for (const space of experiment.spaces) {
        const workflow = workflows.find(w => w.name === space.workflowName);
        if (!workflow) {
          errors.push(
            `Workflow '${space.workflowName}' referenced in space '${space.name}' not found`
          );
        }
      }

      // Validate task implementations
      const resolvedTasks = this.taskResolver.resolve(experiment, workflows);
      for (const task of resolvedTasks.values()) {
        if (!task.implementation) {
          errors.push(
            `Abstract task '${task.name}' in workflow '${task.workflowName}' has no implementation`
          );
        }
      }

      // Check for unused parameters
      const usedParams = new Set<string>();
      for (const space of experiment.spaces) {
        space.parameters.forEach(param => usedParams.add(param.name));
        space.taskConfigurations.forEach(config =>
          config.parameters.forEach(param => usedParams.add(param.name))
        );
      }

      const definedParams = new Set<string>();
      const staticParams = new Set<string>();
      workflows.forEach(workflow =>
        workflow.tasks.forEach(task =>
          task.parameters.forEach(param => {
            definedParams.add(param.name);
            // Parameters with static values (non-null) are considered "used"
            if (param.value !== null) {
              staticParams.add(param.name);
            }
          })
        )
      );

      for (const param of definedParams) {
        // A parameter is considered "used" if it's either used in experiment spaces
        // or has a static value defined in the workflow
        if (!usedParams.has(param) && !staticParams.has(param)) {
          warnings.push(`Parameter '${param}' is defined but never used`);
        }
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    return { errors, warnings };
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

    if (this.verbose) {
      console.log(`Found workflows: ${uniqueWorkflowNames.join(', ')}`);
    }

    const workflows: WorkflowModel[] = [];

    for (const workflowName of uniqueWorkflowNames) {
      const workflowFiles = await this.fileResolver!.findWorkflowFiles(workflowName);

      for (const workflowFile of workflowFiles) {
        if (this.verbose) {
          console.log(`Parsing workflow file: ${workflowFile}`);
        }
        const workflow = await this.workflowParser.parse(workflowFile);
        workflows.push(workflow);
      }
    }

    return { experiment, workflows };
  }

  private initializeFileResolver(espaceFilePath: string): void {
    const workspaceDir = path.dirname(espaceFilePath);
    this.fileResolver = new FileResolver(workspaceDir);
    if (this.verbose) {
      console.log(`File resolver initialized with directory: ${workspaceDir}`);
    }
  }
}
