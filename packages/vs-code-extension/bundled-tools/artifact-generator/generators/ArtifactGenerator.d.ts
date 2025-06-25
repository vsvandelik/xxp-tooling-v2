export interface ArtifactGeneratorOptions {
    verbose?: boolean;
    workflowDirectory?: string;
}
export interface ValidationResult {
    errors: string[];
    warnings: string[];
}
export interface ArtifactGeneratorOutput {
    artifact?: any;
    validation: ValidationResult;
}
export declare class ArtifactGenerator {
    private verbose;
    private experimentParser;
    private workflowParser;
    private fileResolver;
    private taskResolver;
    private parameterResolver;
    private dataFlowResolver;
    private dataResolver;
    private taskGenerator;
    private spaceGenerator;
    private controlFlowGenerator;
    constructor(options: ArtifactGeneratorOptions);
    generate(espaceFilePath: string): Promise<ArtifactGeneratorOutput>;
    validate(espaceFilePath: string): Promise<ValidationResult>;
    private resolveWorkflowInheritance;
    private parseFiles;
    private initializeFileResolver;
    private validateControlFlow;
    private canReachEnd;
    private validateWorkflows;
    private validateWorkflowsAfterInheritance;
    private validateStrategies;
    private validateWorkflowInheritance;
    private hasCircularInheritance;
    private validateTaskChains;
    private validateCircularTaskDependencies;
    private hasCircularDependency;
    private getReachableSpaces;
    private filterExperimentSpaces;
    private getUsedTaskIds;
    private filterTasks;
}
//# sourceMappingURL=ArtifactGenerator.d.ts.map