import { TaskDefinition } from '../models/ArtifactModel.js';
import { ResolvedTask } from '../resolvers/TaskResolver.js';
export declare class TaskGenerator {
    generate(resolvedTasks: Map<string, ResolvedTask>, workflowsInUse?: Set<string>): TaskDefinition[][];
    private createTaskDefinition;
}
//# sourceMappingURL=TaskGenerator.d.ts.map