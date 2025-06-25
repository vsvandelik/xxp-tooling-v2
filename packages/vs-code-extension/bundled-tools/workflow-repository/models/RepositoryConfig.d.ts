export interface RepositoryConfig {
    readonly type: 'local' | 'remote';
    readonly name: string;
    readonly path: string;
    readonly url?: string;
    readonly authToken?: string;
    readonly isDefault?: boolean;
}
export interface WorkflowSearchOptions {
    readonly query?: string;
    readonly tags?: readonly string[];
    readonly author?: string;
    readonly path?: string;
    readonly limit?: number;
    readonly offset?: number;
}
//# sourceMappingURL=RepositoryConfig.d.ts.map