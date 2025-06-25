import * as antlr from "antlr4ng";
import { ESPACEListener } from "./ESPACEListener.js";
import { ESPACEVisitor } from "./ESPACEVisitor.js";
export declare class ESPACEParser extends antlr.Parser {
    static readonly SEMICOLON = 1;
    static readonly ARROW = 2;
    static readonly CONDITION_ARROW = 3;
    static readonly LBRACE = 4;
    static readonly RBRACE = 5;
    static readonly LPAREN = 6;
    static readonly RPAREN = 7;
    static readonly EQUALS = 8;
    static readonly COMMA = 9;
    static readonly EXPERIMENT = 10;
    static readonly SPACE = 11;
    static readonly OF = 12;
    static readonly STRATEGY = 13;
    static readonly PARAM = 14;
    static readonly ENUM = 15;
    static readonly RANGE = 16;
    static readonly CONFIGURE = 17;
    static readonly TASK = 18;
    static readonly CONTROL = 19;
    static readonly CONDITION = 20;
    static readonly DEFINE = 21;
    static readonly DATA = 22;
    static readonly START = 23;
    static readonly END = 24;
    static readonly BOOLEAN = 25;
    static readonly IDENTIFIER = 26;
    static readonly STRING = 27;
    static readonly NUMBER = 28;
    static readonly WS = 29;
    static readonly COMMENT = 30;
    static readonly RULE_program = 0;
    static readonly RULE_experimentDeclaration = 1;
    static readonly RULE_experimentHeader = 2;
    static readonly RULE_experimentBody = 3;
    static readonly RULE_experimentContent = 4;
    static readonly RULE_spaceDeclaration = 5;
    static readonly RULE_spaceHeader = 6;
    static readonly RULE_spaceBody = 7;
    static readonly RULE_spaceContent = 8;
    static readonly RULE_strategyStatement = 9;
    static readonly RULE_paramDefinition = 10;
    static readonly RULE_paramValue = 11;
    static readonly RULE_enumFunction = 12;
    static readonly RULE_rangeFunction = 13;
    static readonly RULE_taskConfiguration = 14;
    static readonly RULE_taskConfigurationHeader = 15;
    static readonly RULE_taskConfigurationBody = 16;
    static readonly RULE_configurationContent = 17;
    static readonly RULE_paramAssignment = 18;
    static readonly RULE_controlBlock = 19;
    static readonly RULE_controlBody = 20;
    static readonly RULE_controlContent = 21;
    static readonly RULE_simpleTransition = 22;
    static readonly RULE_conditionalTransition = 23;
    static readonly RULE_conditionalTransitionHeader = 24;
    static readonly RULE_conditionalTransitionBody = 25;
    static readonly RULE_condition = 26;
    static readonly RULE_controlChainElement = 27;
    static readonly RULE_dataDefinition = 28;
    static readonly RULE_workflowNameRead = 29;
    static readonly RULE_taskNameRead = 30;
    static readonly RULE_spaceNameRead = 31;
    static readonly RULE_expression = 32;
    static readonly literalNames: (string | null)[];
    static readonly symbolicNames: (string | null)[];
    static readonly ruleNames: string[];
    get grammarFileName(): string;
    get literalNames(): (string | null)[];
    get symbolicNames(): (string | null)[];
    get ruleNames(): string[];
    get serializedATN(): number[];
    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException;
    constructor(input: antlr.TokenStream);
    program(): ProgramContext;
    experimentDeclaration(): ExperimentDeclarationContext;
    experimentHeader(): ExperimentHeaderContext;
    experimentBody(): ExperimentBodyContext;
    experimentContent(): ExperimentContentContext;
    spaceDeclaration(): SpaceDeclarationContext;
    spaceHeader(): SpaceHeaderContext;
    spaceBody(): SpaceBodyContext;
    spaceContent(): SpaceContentContext;
    strategyStatement(): StrategyStatementContext;
    paramDefinition(): ParamDefinitionContext;
    paramValue(): ParamValueContext;
    enumFunction(): EnumFunctionContext;
    rangeFunction(): RangeFunctionContext;
    taskConfiguration(): TaskConfigurationContext;
    taskConfigurationHeader(): TaskConfigurationHeaderContext;
    taskConfigurationBody(): TaskConfigurationBodyContext;
    configurationContent(): ConfigurationContentContext;
    paramAssignment(): ParamAssignmentContext;
    controlBlock(): ControlBlockContext;
    controlBody(): ControlBodyContext;
    controlContent(): ControlContentContext;
    simpleTransition(): SimpleTransitionContext;
    conditionalTransition(): ConditionalTransitionContext;
    conditionalTransitionHeader(): ConditionalTransitionHeaderContext;
    conditionalTransitionBody(): ConditionalTransitionBodyContext;
    condition(): ConditionContext;
    controlChainElement(): ControlChainElementContext;
    dataDefinition(): DataDefinitionContext;
    workflowNameRead(): WorkflowNameReadContext;
    taskNameRead(): TaskNameReadContext;
    spaceNameRead(): SpaceNameReadContext;
    expression(): ExpressionContext;
    static readonly _serializedATN: number[];
    private static __ATN;
    static get _ATN(): antlr.ATN;
    private static readonly vocabulary;
    get vocabulary(): antlr.Vocabulary;
    private static readonly decisionsToDFA;
}
export declare class ProgramContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    experimentDeclaration(): ExperimentDeclarationContext;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ExperimentDeclarationContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    experimentHeader(): ExperimentHeaderContext;
    experimentBody(): ExperimentBodyContext;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ExperimentHeaderContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    EXPERIMENT(): antlr.TerminalNode;
    IDENTIFIER(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ExperimentBodyContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    LBRACE(): antlr.TerminalNode;
    RBRACE(): antlr.TerminalNode;
    experimentContent(): ExperimentContentContext[];
    experimentContent(i: number): ExperimentContentContext | null;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ExperimentContentContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    spaceDeclaration(): SpaceDeclarationContext | null;
    controlBlock(): ControlBlockContext | null;
    dataDefinition(): DataDefinitionContext | null;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class SpaceDeclarationContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    spaceHeader(): SpaceHeaderContext;
    spaceBody(): SpaceBodyContext;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class SpaceHeaderContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    SPACE(): antlr.TerminalNode;
    IDENTIFIER(): antlr.TerminalNode;
    OF(): antlr.TerminalNode;
    workflowNameRead(): WorkflowNameReadContext;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class SpaceBodyContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    LBRACE(): antlr.TerminalNode;
    RBRACE(): antlr.TerminalNode;
    spaceContent(): SpaceContentContext[];
    spaceContent(i: number): SpaceContentContext | null;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class SpaceContentContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    strategyStatement(): StrategyStatementContext | null;
    paramDefinition(): ParamDefinitionContext | null;
    taskConfiguration(): TaskConfigurationContext | null;
    dataDefinition(): DataDefinitionContext | null;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class StrategyStatementContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    STRATEGY(): antlr.TerminalNode;
    IDENTIFIER(): antlr.TerminalNode;
    SEMICOLON(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ParamDefinitionContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    PARAM(): antlr.TerminalNode;
    IDENTIFIER(): antlr.TerminalNode;
    EQUALS(): antlr.TerminalNode;
    paramValue(): ParamValueContext;
    SEMICOLON(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ParamValueContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    enumFunction(): EnumFunctionContext | null;
    rangeFunction(): RangeFunctionContext | null;
    expression(): ExpressionContext | null;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class EnumFunctionContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    ENUM(): antlr.TerminalNode;
    LPAREN(): antlr.TerminalNode;
    expression(): ExpressionContext[];
    expression(i: number): ExpressionContext | null;
    RPAREN(): antlr.TerminalNode;
    COMMA(): antlr.TerminalNode[];
    COMMA(i: number): antlr.TerminalNode | null;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class RangeFunctionContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    RANGE(): antlr.TerminalNode;
    LPAREN(): antlr.TerminalNode;
    NUMBER(): antlr.TerminalNode[];
    NUMBER(i: number): antlr.TerminalNode | null;
    COMMA(): antlr.TerminalNode[];
    COMMA(i: number): antlr.TerminalNode | null;
    RPAREN(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class TaskConfigurationContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    taskConfigurationHeader(): TaskConfigurationHeaderContext;
    taskConfigurationBody(): TaskConfigurationBodyContext;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class TaskConfigurationHeaderContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    CONFIGURE(): antlr.TerminalNode;
    TASK(): antlr.TerminalNode;
    taskNameRead(): TaskNameReadContext;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class TaskConfigurationBodyContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    LBRACE(): antlr.TerminalNode;
    RBRACE(): antlr.TerminalNode;
    configurationContent(): ConfigurationContentContext[];
    configurationContent(i: number): ConfigurationContentContext | null;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ConfigurationContentContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    paramAssignment(): ParamAssignmentContext;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ParamAssignmentContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    PARAM(): antlr.TerminalNode;
    IDENTIFIER(): antlr.TerminalNode;
    EQUALS(): antlr.TerminalNode;
    paramValue(): ParamValueContext;
    SEMICOLON(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ControlBlockContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    CONTROL(): antlr.TerminalNode;
    controlBody(): ControlBodyContext;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ControlBodyContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    LBRACE(): antlr.TerminalNode;
    RBRACE(): antlr.TerminalNode;
    controlContent(): ControlContentContext[];
    controlContent(i: number): ControlContentContext | null;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ControlContentContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    simpleTransition(): SimpleTransitionContext | null;
    conditionalTransition(): ConditionalTransitionContext | null;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class SimpleTransitionContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    controlChainElement(): ControlChainElementContext[];
    controlChainElement(i: number): ControlChainElementContext | null;
    SEMICOLON(): antlr.TerminalNode;
    ARROW(): antlr.TerminalNode[];
    ARROW(i: number): antlr.TerminalNode | null;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ConditionalTransitionContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    conditionalTransitionHeader(): ConditionalTransitionHeaderContext;
    conditionalTransitionBody(): ConditionalTransitionBodyContext;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ConditionalTransitionHeaderContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    controlChainElement(): ControlChainElementContext[];
    controlChainElement(i: number): ControlChainElementContext | null;
    CONDITION_ARROW(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ConditionalTransitionBodyContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    LBRACE(): antlr.TerminalNode;
    RBRACE(): antlr.TerminalNode;
    condition(): ConditionContext[];
    condition(i: number): ConditionContext | null;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ConditionContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    CONDITION(): antlr.TerminalNode;
    STRING(): antlr.TerminalNode;
    SEMICOLON(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ControlChainElementContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    START(): antlr.TerminalNode | null;
    END(): antlr.TerminalNode | null;
    spaceNameRead(): SpaceNameReadContext | null;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class DataDefinitionContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    DEFINE(): antlr.TerminalNode;
    DATA(): antlr.TerminalNode;
    IDENTIFIER(): antlr.TerminalNode;
    EQUALS(): antlr.TerminalNode;
    STRING(): antlr.TerminalNode;
    SEMICOLON(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class WorkflowNameReadContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    IDENTIFIER(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class TaskNameReadContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    IDENTIFIER(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class SpaceNameReadContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    IDENTIFIER(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
export declare class ExpressionContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    NUMBER(): antlr.TerminalNode | null;
    STRING(): antlr.TerminalNode | null;
    BOOLEAN(): antlr.TerminalNode | null;
    get ruleIndex(): number;
    enterRule(listener: ESPACEListener): void;
    exitRule(listener: ESPACEListener): void;
    accept<Result>(visitor: ESPACEVisitor<Result>): Result | null;
}
//# sourceMappingURL=ESPACEParser.d.ts.map