/**
 * Workflow item and content model definitions.
 * Defines structures for complete workflow data including content,
 * metadata, and attachment information.
 */

import { WorkflowAttachment } from './WorkflowAttachment.js';
import { WorkflowMetadata } from './WorkflowMetadata.js';

/**
 * Complete workflow item including metadata, main file content, and attachments.
 * Represents a full workflow with all associated data and files.
 */
export interface WorkflowItem {
  /** Workflow metadata and descriptive information */
  readonly metadata: WorkflowMetadata;
  /** Content of the main workflow file as string */
  readonly mainFileContent: string;
  /** Detailed attachment file information */
  readonly attachments: readonly WorkflowAttachment[];
}

/**
 * Raw content data for a workflow.
 * Contains the main workflow file content and binary attachment data.
 */
export interface WorkflowContent {
  /** Content of the main workflow file as string */
  readonly mainFile: string;
  /** Map of attachment file names to their binary content */
  readonly attachments: ReadonlyMap<string, Buffer>;
}
