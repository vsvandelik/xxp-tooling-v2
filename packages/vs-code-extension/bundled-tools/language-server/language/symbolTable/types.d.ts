import { EspaceTaskConfigurationBodyContext, EspaceControlBodyContext, EspaceSpaceBodyContext, XxpDataNameReadContext, XxpTaskConfigurationBodyContext, XxpTaskNameReadContext, XxpWorkflowNameReadContext } from '@extremexp/core';
export declare enum ChainPartType {
    Data = 0,
    Task = 1
}
export type ReadNameContext = XxpDataNameReadContext | XxpTaskNameReadContext | XxpWorkflowNameReadContext;
export type ScopedParserRuleContext = XxpTaskConfigurationBodyContext | EspaceControlBodyContext | EspaceSpaceBodyContext | EspaceTaskConfigurationBodyContext;
//# sourceMappingURL=types.d.ts.map