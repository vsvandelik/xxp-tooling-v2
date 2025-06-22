import {
  EspaceTaskConfigurationBodyContext,
  EspaceControlBodyContext,
  EspaceSpaceBodyContext,
  XxpDataNameReadContext,
  XxpTaskConfigurationBodyContext,
  XxpTaskNameReadContext,
  XxpWorkflowNameReadContext,
} from '@extremexp/core';

export enum ChainPartType {
  Data,
  Task,
}

export type ReadNameContext =
  | XxpDataNameReadContext
  | XxpTaskNameReadContext
  | XxpWorkflowNameReadContext;
export type ScopedParserRuleContext =
  | XxpTaskConfigurationBodyContext
  | EspaceControlBodyContext
  | EspaceSpaceBodyContext
  | EspaceTaskConfigurationBodyContext;
