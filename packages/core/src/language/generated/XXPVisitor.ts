// Generated from src/language/grammar/XXP.g4 by ANTLR 4.13.1

import { AbstractParseTreeVisitor } from "antlr4ng";


import { ProgramContext } from "./XXPParser.js";
import { WorkflowDeclarationContext } from "./XXPParser.js";
import { WorkflowHeaderContext } from "./XXPParser.js";
import { WorkflowBodyContext } from "./XXPParser.js";
import { WorkflowContentContext } from "./XXPParser.js";
import { DataDefinitionContext } from "./XXPParser.js";
import { TaskDefinitionContext } from "./XXPParser.js";
import { TaskChainContext } from "./XXPParser.js";
import { ChainElementContext } from "./XXPParser.js";
import { TaskConfigurationContext } from "./XXPParser.js";
import { TaskConfigurationHeaderContext } from "./XXPParser.js";
import { TaskConfigurationBodyContext } from "./XXPParser.js";
import { ConfigurationContentContext } from "./XXPParser.js";
import { ImplementationContext } from "./XXPParser.js";
import { ParamAssignmentContext } from "./XXPParser.js";
import { InputStatementContext } from "./XXPParser.js";
import { OutputStatementContext } from "./XXPParser.js";
import { DataNameListContext } from "./XXPParser.js";
import { WorkflowNameReadContext } from "./XXPParser.js";
import { DataNameReadContext } from "./XXPParser.js";
import { TaskNameReadContext } from "./XXPParser.js";
import { ExpressionContext } from "./XXPParser.js";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `XXPParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export class XXPVisitor<Result> extends AbstractParseTreeVisitor<Result> {
    /**
     * Visit a parse tree produced by `XXPParser.program`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProgram?: (ctx: ProgramContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.workflowDeclaration`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWorkflowDeclaration?: (ctx: WorkflowDeclarationContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.workflowHeader`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWorkflowHeader?: (ctx: WorkflowHeaderContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.workflowBody`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWorkflowBody?: (ctx: WorkflowBodyContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.workflowContent`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWorkflowContent?: (ctx: WorkflowContentContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.dataDefinition`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDataDefinition?: (ctx: DataDefinitionContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.taskDefinition`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTaskDefinition?: (ctx: TaskDefinitionContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.taskChain`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTaskChain?: (ctx: TaskChainContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.chainElement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitChainElement?: (ctx: ChainElementContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.taskConfiguration`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTaskConfiguration?: (ctx: TaskConfigurationContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.taskConfigurationHeader`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTaskConfigurationHeader?: (ctx: TaskConfigurationHeaderContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.taskConfigurationBody`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTaskConfigurationBody?: (ctx: TaskConfigurationBodyContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.configurationContent`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitConfigurationContent?: (ctx: ConfigurationContentContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.implementation`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitImplementation?: (ctx: ImplementationContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.paramAssignment`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitParamAssignment?: (ctx: ParamAssignmentContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.inputStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitInputStatement?: (ctx: InputStatementContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.outputStatement`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOutputStatement?: (ctx: OutputStatementContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.dataNameList`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDataNameList?: (ctx: DataNameListContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.workflowNameRead`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWorkflowNameRead?: (ctx: WorkflowNameReadContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.dataNameRead`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDataNameRead?: (ctx: DataNameReadContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.taskNameRead`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTaskNameRead?: (ctx: TaskNameReadContext) => Result;
    /**
     * Visit a parse tree produced by `XXPParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExpression?: (ctx: ExpressionContext) => Result;
}

