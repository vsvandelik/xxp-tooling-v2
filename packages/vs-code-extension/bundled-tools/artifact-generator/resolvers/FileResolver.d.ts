export declare class FileResolver {
    private workflowDirectory;
    constructor(workflowDirectory: string);
    findWorkflowFiles(workflowName: string): Promise<string[]>;
    resolveDataPath(dataPath: string): string;
    resolveImplementationPath(implementationPath: string): string;
}
//# sourceMappingURL=FileResolver.d.ts.map