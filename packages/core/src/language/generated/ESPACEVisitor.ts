// Generated from src/language/grammar/ESPACE.g4 by ANTLR 4.13.1

import { AbstractParseTreeVisitor } from "antlr4ng";


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
import { StrategyNameContext } from "./ESPACEParser.js";
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
 * This interface defines a complete generic visitor for a parse tree produced
 * by `ESPACEParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export class ESPACEVisitor<Result> extends AbstractParseTreeVisitor<Result> {
    /**
     * Visit a parse tree produced by `ESPACEParser.program`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProgram?: (ctx: ProgramContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.experimentDeclaration`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExperimentDeclaration?: (ctx: ExperimentDeclarationContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.experimentHeader`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExperimentHeader?: (ctx: ExperimentHeaderContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.experimentBody`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExperimentBody?: (ctx: ExperimentBodyContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.experimentContent`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExperimentContent?: (ctx: ExperimentContentContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.spaceDeclaration`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSpaceDeclaration?: (ctx: SpaceDeclarationContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.spaceHeader`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSpaceHeader?: (ctx: SpaceHeaderContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.spaceBody`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSpaceBody?: (ctx: SpaceBodyContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.spaceContent`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSpaceContent?: (ctx: SpaceContentContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.strategyStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStrategyStatement?: (ctx: StrategyStatementContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.strategyName`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStrategyName?: (ctx: StrategyNameContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.paramDefinition`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitParamDefinition?: (ctx: ParamDefinitionContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.paramValue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitParamValue?: (ctx: ParamValueContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.enumFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEnumFunction?: (ctx: EnumFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.rangeFunction`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitRangeFunction?: (ctx: RangeFunctionContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.taskConfiguration`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTaskConfiguration?: (ctx: TaskConfigurationContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.taskConfigurationHeader`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTaskConfigurationHeader?: (ctx: TaskConfigurationHeaderContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.taskConfigurationBody`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTaskConfigurationBody?: (ctx: TaskConfigurationBodyContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.configurationContent`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitConfigurationContent?: (ctx: ConfigurationContentContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.paramAssignment`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitParamAssignment?: (ctx: ParamAssignmentContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.controlBlock`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitControlBlock?: (ctx: ControlBlockContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.controlBody`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitControlBody?: (ctx: ControlBodyContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.controlContent`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitControlContent?: (ctx: ControlContentContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.simpleTransition`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSimpleTransition?: (ctx: SimpleTransitionContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.conditionalTransition`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitConditionalTransition?: (ctx: ConditionalTransitionContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.conditionalTransitionHeader`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitConditionalTransitionHeader?: (ctx: ConditionalTransitionHeaderContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.conditionalTransitionBody`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitConditionalTransitionBody?: (ctx: ConditionalTransitionBodyContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.condition`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCondition?: (ctx: ConditionContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.controlChainElement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitControlChainElement?: (ctx: ControlChainElementContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.dataDefinition`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDataDefinition?: (ctx: DataDefinitionContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.workflowNameRead`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWorkflowNameRead?: (ctx: WorkflowNameReadContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.taskNameRead`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTaskNameRead?: (ctx: TaskNameReadContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.spaceNameRead`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSpaceNameRead?: (ctx: SpaceNameReadContext) => Result;
    /**
     * Visit a parse tree produced by `ESPACEParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExpression?: (ctx: ExpressionContext) => Result;
}

