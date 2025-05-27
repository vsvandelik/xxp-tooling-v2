// Generated from src/language/grammar/XXP.g4 by ANTLR 4.13.1

import { ErrorNode, ParseTreeListener, ParserRuleContext, TerminalNode } from "antlr4ng";


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
 * This interface defines a complete listener for a parse tree produced by
 * `XXPParser`.
 */
export class XXPListener implements ParseTreeListener {
    /**
     * Enter a parse tree produced by `XXPParser.program`.
     * @param ctx the parse tree
     */
    enterProgram?: (ctx: ProgramContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.program`.
     * @param ctx the parse tree
     */
    exitProgram?: (ctx: ProgramContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.workflowDeclaration`.
     * @param ctx the parse tree
     */
    enterWorkflowDeclaration?: (ctx: WorkflowDeclarationContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.workflowDeclaration`.
     * @param ctx the parse tree
     */
    exitWorkflowDeclaration?: (ctx: WorkflowDeclarationContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.workflowHeader`.
     * @param ctx the parse tree
     */
    enterWorkflowHeader?: (ctx: WorkflowHeaderContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.workflowHeader`.
     * @param ctx the parse tree
     */
    exitWorkflowHeader?: (ctx: WorkflowHeaderContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.workflowBody`.
     * @param ctx the parse tree
     */
    enterWorkflowBody?: (ctx: WorkflowBodyContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.workflowBody`.
     * @param ctx the parse tree
     */
    exitWorkflowBody?: (ctx: WorkflowBodyContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.workflowContent`.
     * @param ctx the parse tree
     */
    enterWorkflowContent?: (ctx: WorkflowContentContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.workflowContent`.
     * @param ctx the parse tree
     */
    exitWorkflowContent?: (ctx: WorkflowContentContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.dataDefinition`.
     * @param ctx the parse tree
     */
    enterDataDefinition?: (ctx: DataDefinitionContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.dataDefinition`.
     * @param ctx the parse tree
     */
    exitDataDefinition?: (ctx: DataDefinitionContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.taskDefinition`.
     * @param ctx the parse tree
     */
    enterTaskDefinition?: (ctx: TaskDefinitionContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.taskDefinition`.
     * @param ctx the parse tree
     */
    exitTaskDefinition?: (ctx: TaskDefinitionContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.taskChain`.
     * @param ctx the parse tree
     */
    enterTaskChain?: (ctx: TaskChainContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.taskChain`.
     * @param ctx the parse tree
     */
    exitTaskChain?: (ctx: TaskChainContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.chainElement`.
     * @param ctx the parse tree
     */
    enterChainElement?: (ctx: ChainElementContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.chainElement`.
     * @param ctx the parse tree
     */
    exitChainElement?: (ctx: ChainElementContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.taskConfiguration`.
     * @param ctx the parse tree
     */
    enterTaskConfiguration?: (ctx: TaskConfigurationContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.taskConfiguration`.
     * @param ctx the parse tree
     */
    exitTaskConfiguration?: (ctx: TaskConfigurationContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.taskConfigurationHeader`.
     * @param ctx the parse tree
     */
    enterTaskConfigurationHeader?: (ctx: TaskConfigurationHeaderContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.taskConfigurationHeader`.
     * @param ctx the parse tree
     */
    exitTaskConfigurationHeader?: (ctx: TaskConfigurationHeaderContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.taskConfigurationBody`.
     * @param ctx the parse tree
     */
    enterTaskConfigurationBody?: (ctx: TaskConfigurationBodyContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.taskConfigurationBody`.
     * @param ctx the parse tree
     */
    exitTaskConfigurationBody?: (ctx: TaskConfigurationBodyContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.configurationContent`.
     * @param ctx the parse tree
     */
    enterConfigurationContent?: (ctx: ConfigurationContentContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.configurationContent`.
     * @param ctx the parse tree
     */
    exitConfigurationContent?: (ctx: ConfigurationContentContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.implementation`.
     * @param ctx the parse tree
     */
    enterImplementation?: (ctx: ImplementationContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.implementation`.
     * @param ctx the parse tree
     */
    exitImplementation?: (ctx: ImplementationContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.paramAssignment`.
     * @param ctx the parse tree
     */
    enterParamAssignment?: (ctx: ParamAssignmentContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.paramAssignment`.
     * @param ctx the parse tree
     */
    exitParamAssignment?: (ctx: ParamAssignmentContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.inputStatement`.
     * @param ctx the parse tree
     */
    enterInputStatement?: (ctx: InputStatementContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.inputStatement`.
     * @param ctx the parse tree
     */
    exitInputStatement?: (ctx: InputStatementContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.outputStatement`.
     * @param ctx the parse tree
     */
    enterOutputStatement?: (ctx: OutputStatementContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.outputStatement`.
     * @param ctx the parse tree
     */
    exitOutputStatement?: (ctx: OutputStatementContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.dataNameList`.
     * @param ctx the parse tree
     */
    enterDataNameList?: (ctx: DataNameListContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.dataNameList`.
     * @param ctx the parse tree
     */
    exitDataNameList?: (ctx: DataNameListContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.workflowNameRead`.
     * @param ctx the parse tree
     */
    enterWorkflowNameRead?: (ctx: WorkflowNameReadContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.workflowNameRead`.
     * @param ctx the parse tree
     */
    exitWorkflowNameRead?: (ctx: WorkflowNameReadContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.dataNameRead`.
     * @param ctx the parse tree
     */
    enterDataNameRead?: (ctx: DataNameReadContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.dataNameRead`.
     * @param ctx the parse tree
     */
    exitDataNameRead?: (ctx: DataNameReadContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.taskNameRead`.
     * @param ctx the parse tree
     */
    enterTaskNameRead?: (ctx: TaskNameReadContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.taskNameRead`.
     * @param ctx the parse tree
     */
    exitTaskNameRead?: (ctx: TaskNameReadContext) => void;
    /**
     * Enter a parse tree produced by `XXPParser.expression`.
     * @param ctx the parse tree
     */
    enterExpression?: (ctx: ExpressionContext) => void;
    /**
     * Exit a parse tree produced by `XXPParser.expression`.
     * @param ctx the parse tree
     */
    exitExpression?: (ctx: ExpressionContext) => void;

    visitTerminal(node: TerminalNode): void {}
    visitErrorNode(node: ErrorNode): void {}
    enterEveryRule(node: ParserRuleContext): void {}
    exitEveryRule(node: ParserRuleContext): void {}
}

