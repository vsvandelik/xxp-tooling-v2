// Generated from src/language/grammar/ESPACE.g4 by ANTLR 4.13.1

import { ErrorNode, ParseTreeListener, ParserRuleContext, TerminalNode } from "antlr4ng";


import { ProgramContext } from "./ESPACEParser.js";
import { ExperimentDeclarationContext } from "./ESPACEParser.js";
import { ExperimentHeaderContext } from "./ESPACEParser.js";
import { ExperimentBodyContext } from "./ESPACEParser.js";
import { ExperimentContentContext } from "./ESPACEParser.js";
import { SpaceDeclarationContext } from "./ESPACEParser.js";
import { SpaceHeaderContext } from "./ESPACEParser.js";
import { SpaceBodyContext } from "./ESPACEParser.js";
import { SpaceContentContext } from "./ESPACEParser.js";
import { StrategyStatementContext } from "./ESPACEParser.js";
import { ParamDefinitionContext } from "./ESPACEParser.js";
import { ParamValueContext } from "./ESPACEParser.js";
import { EnumFunctionContext } from "./ESPACEParser.js";
import { RangeFunctionContext } from "./ESPACEParser.js";
import { TaskConfigurationContext } from "./ESPACEParser.js";
import { TaskConfigurationHeaderContext } from "./ESPACEParser.js";
import { TaskConfigurationBodyContext } from "./ESPACEParser.js";
import { ConfigurationContentContext } from "./ESPACEParser.js";
import { ParamAssignmentContext } from "./ESPACEParser.js";
import { ControlBlockContext } from "./ESPACEParser.js";
import { ControlBodyContext } from "./ESPACEParser.js";
import { ControlContentContext } from "./ESPACEParser.js";
import { SimpleTransitionContext } from "./ESPACEParser.js";
import { ConditionalTransitionContext } from "./ESPACEParser.js";
import { ConditionalTransitionHeaderContext } from "./ESPACEParser.js";
import { ConditionalTransitionBodyContext } from "./ESPACEParser.js";
import { ConditionContext } from "./ESPACEParser.js";
import { ControlChainElementContext } from "./ESPACEParser.js";
import { DataDefinitionContext } from "./ESPACEParser.js";
import { WorkflowNameReadContext } from "./ESPACEParser.js";
import { TaskNameReadContext } from "./ESPACEParser.js";
import { SpaceNameReadContext } from "./ESPACEParser.js";
import { ExpressionContext } from "./ESPACEParser.js";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `ESPACEParser`.
 */
export class ESPACEListener implements ParseTreeListener {
    /**
     * Enter a parse tree produced by `ESPACEParser.program`.
     * @param ctx the parse tree
     */
    enterProgram?: (ctx: ProgramContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.program`.
     * @param ctx the parse tree
     */
    exitProgram?: (ctx: ProgramContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.experimentDeclaration`.
     * @param ctx the parse tree
     */
    enterExperimentDeclaration?: (ctx: ExperimentDeclarationContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.experimentDeclaration`.
     * @param ctx the parse tree
     */
    exitExperimentDeclaration?: (ctx: ExperimentDeclarationContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.experimentHeader`.
     * @param ctx the parse tree
     */
    enterExperimentHeader?: (ctx: ExperimentHeaderContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.experimentHeader`.
     * @param ctx the parse tree
     */
    exitExperimentHeader?: (ctx: ExperimentHeaderContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.experimentBody`.
     * @param ctx the parse tree
     */
    enterExperimentBody?: (ctx: ExperimentBodyContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.experimentBody`.
     * @param ctx the parse tree
     */
    exitExperimentBody?: (ctx: ExperimentBodyContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.experimentContent`.
     * @param ctx the parse tree
     */
    enterExperimentContent?: (ctx: ExperimentContentContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.experimentContent`.
     * @param ctx the parse tree
     */
    exitExperimentContent?: (ctx: ExperimentContentContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.spaceDeclaration`.
     * @param ctx the parse tree
     */
    enterSpaceDeclaration?: (ctx: SpaceDeclarationContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.spaceDeclaration`.
     * @param ctx the parse tree
     */
    exitSpaceDeclaration?: (ctx: SpaceDeclarationContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.spaceHeader`.
     * @param ctx the parse tree
     */
    enterSpaceHeader?: (ctx: SpaceHeaderContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.spaceHeader`.
     * @param ctx the parse tree
     */
    exitSpaceHeader?: (ctx: SpaceHeaderContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.spaceBody`.
     * @param ctx the parse tree
     */
    enterSpaceBody?: (ctx: SpaceBodyContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.spaceBody`.
     * @param ctx the parse tree
     */
    exitSpaceBody?: (ctx: SpaceBodyContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.spaceContent`.
     * @param ctx the parse tree
     */
    enterSpaceContent?: (ctx: SpaceContentContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.spaceContent`.
     * @param ctx the parse tree
     */
    exitSpaceContent?: (ctx: SpaceContentContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.strategyStatement`.
     * @param ctx the parse tree
     */
    enterStrategyStatement?: (ctx: StrategyStatementContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.strategyStatement`.
     * @param ctx the parse tree
     */
    exitStrategyStatement?: (ctx: StrategyStatementContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.paramDefinition`.
     * @param ctx the parse tree
     */
    enterParamDefinition?: (ctx: ParamDefinitionContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.paramDefinition`.
     * @param ctx the parse tree
     */
    exitParamDefinition?: (ctx: ParamDefinitionContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.paramValue`.
     * @param ctx the parse tree
     */
    enterParamValue?: (ctx: ParamValueContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.paramValue`.
     * @param ctx the parse tree
     */
    exitParamValue?: (ctx: ParamValueContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.enumFunction`.
     * @param ctx the parse tree
     */
    enterEnumFunction?: (ctx: EnumFunctionContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.enumFunction`.
     * @param ctx the parse tree
     */
    exitEnumFunction?: (ctx: EnumFunctionContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.rangeFunction`.
     * @param ctx the parse tree
     */
    enterRangeFunction?: (ctx: RangeFunctionContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.rangeFunction`.
     * @param ctx the parse tree
     */
    exitRangeFunction?: (ctx: RangeFunctionContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.taskConfiguration`.
     * @param ctx the parse tree
     */
    enterTaskConfiguration?: (ctx: TaskConfigurationContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.taskConfiguration`.
     * @param ctx the parse tree
     */
    exitTaskConfiguration?: (ctx: TaskConfigurationContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.taskConfigurationHeader`.
     * @param ctx the parse tree
     */
    enterTaskConfigurationHeader?: (ctx: TaskConfigurationHeaderContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.taskConfigurationHeader`.
     * @param ctx the parse tree
     */
    exitTaskConfigurationHeader?: (ctx: TaskConfigurationHeaderContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.taskConfigurationBody`.
     * @param ctx the parse tree
     */
    enterTaskConfigurationBody?: (ctx: TaskConfigurationBodyContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.taskConfigurationBody`.
     * @param ctx the parse tree
     */
    exitTaskConfigurationBody?: (ctx: TaskConfigurationBodyContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.configurationContent`.
     * @param ctx the parse tree
     */
    enterConfigurationContent?: (ctx: ConfigurationContentContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.configurationContent`.
     * @param ctx the parse tree
     */
    exitConfigurationContent?: (ctx: ConfigurationContentContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.paramAssignment`.
     * @param ctx the parse tree
     */
    enterParamAssignment?: (ctx: ParamAssignmentContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.paramAssignment`.
     * @param ctx the parse tree
     */
    exitParamAssignment?: (ctx: ParamAssignmentContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.controlBlock`.
     * @param ctx the parse tree
     */
    enterControlBlock?: (ctx: ControlBlockContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.controlBlock`.
     * @param ctx the parse tree
     */
    exitControlBlock?: (ctx: ControlBlockContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.controlBody`.
     * @param ctx the parse tree
     */
    enterControlBody?: (ctx: ControlBodyContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.controlBody`.
     * @param ctx the parse tree
     */
    exitControlBody?: (ctx: ControlBodyContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.controlContent`.
     * @param ctx the parse tree
     */
    enterControlContent?: (ctx: ControlContentContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.controlContent`.
     * @param ctx the parse tree
     */
    exitControlContent?: (ctx: ControlContentContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.simpleTransition`.
     * @param ctx the parse tree
     */
    enterSimpleTransition?: (ctx: SimpleTransitionContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.simpleTransition`.
     * @param ctx the parse tree
     */
    exitSimpleTransition?: (ctx: SimpleTransitionContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.conditionalTransition`.
     * @param ctx the parse tree
     */
    enterConditionalTransition?: (ctx: ConditionalTransitionContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.conditionalTransition`.
     * @param ctx the parse tree
     */
    exitConditionalTransition?: (ctx: ConditionalTransitionContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.conditionalTransitionHeader`.
     * @param ctx the parse tree
     */
    enterConditionalTransitionHeader?: (ctx: ConditionalTransitionHeaderContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.conditionalTransitionHeader`.
     * @param ctx the parse tree
     */
    exitConditionalTransitionHeader?: (ctx: ConditionalTransitionHeaderContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.conditionalTransitionBody`.
     * @param ctx the parse tree
     */
    enterConditionalTransitionBody?: (ctx: ConditionalTransitionBodyContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.conditionalTransitionBody`.
     * @param ctx the parse tree
     */
    exitConditionalTransitionBody?: (ctx: ConditionalTransitionBodyContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.condition`.
     * @param ctx the parse tree
     */
    enterCondition?: (ctx: ConditionContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.condition`.
     * @param ctx the parse tree
     */
    exitCondition?: (ctx: ConditionContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.controlChainElement`.
     * @param ctx the parse tree
     */
    enterControlChainElement?: (ctx: ControlChainElementContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.controlChainElement`.
     * @param ctx the parse tree
     */
    exitControlChainElement?: (ctx: ControlChainElementContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.dataDefinition`.
     * @param ctx the parse tree
     */
    enterDataDefinition?: (ctx: DataDefinitionContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.dataDefinition`.
     * @param ctx the parse tree
     */
    exitDataDefinition?: (ctx: DataDefinitionContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.workflowNameRead`.
     * @param ctx the parse tree
     */
    enterWorkflowNameRead?: (ctx: WorkflowNameReadContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.workflowNameRead`.
     * @param ctx the parse tree
     */
    exitWorkflowNameRead?: (ctx: WorkflowNameReadContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.taskNameRead`.
     * @param ctx the parse tree
     */
    enterTaskNameRead?: (ctx: TaskNameReadContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.taskNameRead`.
     * @param ctx the parse tree
     */
    exitTaskNameRead?: (ctx: TaskNameReadContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.spaceNameRead`.
     * @param ctx the parse tree
     */
    enterSpaceNameRead?: (ctx: SpaceNameReadContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.spaceNameRead`.
     * @param ctx the parse tree
     */
    exitSpaceNameRead?: (ctx: SpaceNameReadContext) => void;
    /**
     * Enter a parse tree produced by `ESPACEParser.expression`.
     * @param ctx the parse tree
     */
    enterExpression?: (ctx: ExpressionContext) => void;
    /**
     * Exit a parse tree produced by `ESPACEParser.expression`.
     * @param ctx the parse tree
     */
    exitExpression?: (ctx: ExpressionContext) => void;

    visitTerminal(node: TerminalNode): void {}
    visitErrorNode(node: ErrorNode): void {}
    enterEveryRule(node: ParserRuleContext): void {}
    exitEveryRule(node: ParserRuleContext): void {}
}

