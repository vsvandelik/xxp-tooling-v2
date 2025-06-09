export interface WorkflowAttachment {
  readonly name: string;
  readonly path: string;
  readonly size: number;
  readonly mimeType: string;
  readonly createdAt: Date;
  readonly modifiedAt: Date;
}
