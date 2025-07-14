/**
 * Workflow attachment model definition.
 * Defines the structure for workflow attachment file metadata
 * including file information and timestamps.
 */

/**
 * Metadata for a workflow attachment file.
 * Represents additional files associated with a workflow beyond the main file.
 */
export interface WorkflowAttachment {
  /** Name of the attachment file */
  readonly name: string;
  /** Relative path to the attachment within the workflow */
  readonly path: string;
  /** Size of the attachment file in bytes */
  readonly size: number;
  /** MIME type of the attachment file */
  readonly mimeType: string;
  /** Timestamp when the attachment was created */
  readonly createdAt: Date;
  /** Timestamp when the attachment was last modified */
  readonly modifiedAt: Date;
}
