export interface WorkflowMetadata {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly author: string;
  readonly tags: readonly string[];
  readonly createdAt: Date;
  readonly modifiedAt: Date;
  readonly path: string;
  readonly hasAttachments: boolean;
  readonly mainFile: string;
}
