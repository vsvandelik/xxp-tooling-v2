import { WorkflowAttachment } from './WorkflowAttachment.js';
import { WorkflowMetadata } from './WorkflowMetadata.js';

export interface WorkflowItem {
  readonly metadata: WorkflowMetadata;
  readonly mainFileContent: string;
  readonly attachments: readonly WorkflowAttachment[];
}

export interface WorkflowContent {
  readonly mainFile: string;
  readonly attachments: ReadonlyMap<string, Buffer>;
}
