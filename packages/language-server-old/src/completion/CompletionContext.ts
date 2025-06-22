// packages/language-server/src/completion/CompletionContext.ts
export interface CompletionContext {
  // Document context
  uri: string;
  languageId: 'xxp' | 'espace';
  line: number;
  character: number;

  // Current text context
  lineText: string;
  linePrefix: string;
  lineSuffix: string;
  lastToken?: string;

  // Structural context
  isTopLevel: boolean;
  isInWorkflowBody: boolean;
  isInExperimentBody: boolean;
  isInSpaceBody: boolean;
  isInTaskConfiguration: boolean;
  isInControlBlock: boolean;
  isInTaskChain: boolean;

  // Expected elements
  expectsKeyword: boolean;
  expectsReference: boolean;
  expectsValue: boolean;
  expectsWorkflowName: boolean;
  expectsTaskName: boolean;
  expectsSpaceName: boolean;
  expectsParameterName: boolean;
  expectsDataName: boolean;
  expectsStrategyName: boolean;

  // Available context
  possibleKeywords: string[];
  expectedType?: string;
  workflow?: string;
  experiment?: string;
  space?: string;
  task?: string;

  // Additional flags
  hasTaskChain: boolean;
  hasStrategy: boolean;
  hasStart: boolean;
  canAddEnd: boolean;
  usedTasks: Set<string>;

  // Filter
  filter?: string;
}
