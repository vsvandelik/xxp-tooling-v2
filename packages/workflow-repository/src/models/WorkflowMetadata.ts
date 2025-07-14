/**
 * @fileoverview Workflow metadata model definition.
 * Defines the structure for workflow metadata including identification,
 * authorship, timestamps, and file information.
 */

/**
 * Metadata information for a workflow.
 * Contains all descriptive and technical information about a workflow
 * including identification, authorship, timestamps, and file details.
 */
export interface WorkflowMetadata {
  /** Unique identifier for the workflow (SHA-256 hash) */
  readonly id: string;
  /** Human-readable name of the workflow */
  readonly name: string;
  /** Detailed description of the workflow's purpose and functionality */
  readonly description: string;
  /** Author or creator of the workflow */
  readonly author: string;
  /** Array of tags for categorization and search */
  readonly tags: readonly string[];
  /** Timestamp when the workflow was created */
  readonly createdAt: Date;
  /** Timestamp when the workflow was last modified */
  readonly modifiedAt: Date;
  /** Path to the workflow in the repository */
  readonly path: string;
  /** Whether the workflow has additional attachment files */
  readonly hasAttachments: boolean;
  /** Name of the main workflow file */
  readonly mainFile: string;
}
