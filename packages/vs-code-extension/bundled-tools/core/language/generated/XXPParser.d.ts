import * as antlr from "antlr4ng";
import { XXPListener } from "./XXPListener.js";
import { XXPVisitor } from "./XXPVisitor.js";
export declare class XXPParser extends antlr.Parser {
    static readonly SEMICOLON = 1;
    static readonly ARROW = 2;
    static readonly LBRACE = 3;
    static readonly RBRACE = 4;
    static readonly EQUALS = 5;
    static readonly COMMA = 6;
    static readonly WORKFLOW = 7;
    static readonly FROM = 8;
    static readonly DATA = 9;
    static readonly DEFINE = 10;
    static readonly IMPLEMENTATION = 11;
    static readonly PARAM = 12;
    static readonly TASK = 13;
    static readonly CONFIGURE = 14;
    static readonly INPUT = 15;
    static readonly OUTPUT = 16;
    static readonly START = 17;
    static readonly END = 18;
    static readonly BOOLEAN = 19;
    static readonly IDENTIFIER = 20;
    static readonly STRING = 21;
    static readonly NUMBER = 22;
    static readonly WS = 23;
    static readonly COMMENT = 24;
    static readonly RULE_program = 0;
    static readonly RULE_workflowDeclaration = 1;
    static readonly RULE_workflowHeader = 2;
    static readonly RULE_workflowBody = 3;
    static readonly RULE_workflowContent = 4;
    static readonly RULE_dataDefinition = 5;
    static readonly RULE_taskDefinition = 6;
    static readonly RULE_taskChain = 7;
    static readonly RULE_chainElement = 8;
    static readonly RULE_taskConfiguration = 9;
    static readonly RULE_taskConfigurationHeader = 10;
    static readonly RULE_taskConfigurationBody = 11;
    static readonly RULE_configurationContent = 12;
    static readonly RULE_implementation = 13;
    static readonly RULE_paramAssignment = 14;
    static readonly RULE_inputStatement = 15;
    static readonly RULE_outputStatement = 16;
    static readonly RULE_dataNameList = 17;
    static readonly RULE_workflowNameRead = 18;
    static readonly RULE_dataNameRead = 19;
    static readonly RULE_taskNameRead = 20;
    static readonly RULE_fileNameString = 21;
    static readonly RULE_expression = 22;
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
    workflowDeclaration(): WorkflowDeclarationContext;
    workflowHeader(): WorkflowHeaderContext;
    workflowBody(): WorkflowBodyContext;
    workflowContent(): WorkflowContentContext;
    dataDefinition(): DataDefinitionContext;
    taskDefinition(): TaskDefinitionContext;
    taskChain(): TaskChainContext;
    chainElement(): ChainElementContext;
    taskConfiguration(): TaskConfigurationContext;
    taskConfigurationHeader(): TaskConfigurationHeaderContext;
    taskConfigurationBody(): TaskConfigurationBodyContext;
    configurationContent(): ConfigurationContentContext;
    implementation(): ImplementationContext;
    paramAssignment(): ParamAssignmentContext;
    inputStatement(): InputStatementContext;
    outputStatement(): OutputStatementContext;
    dataNameList(): DataNameListContext;
    workflowNameRead(): WorkflowNameReadContext;
    dataNameRead(): DataNameReadContext;
    taskNameRead(): TaskNameReadContext;
    fileNameString(): FileNameStringContext;
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
    workflowDeclaration(): WorkflowDeclarationContext;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class WorkflowDeclarationContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    workflowHeader(): WorkflowHeaderContext;
    workflowBody(): WorkflowBodyContext;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class WorkflowHeaderContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    WORKFLOW(): antlr.TerminalNode;
    IDENTIFIER(): antlr.TerminalNode;
    FROM(): antlr.TerminalNode | null;
    workflowNameRead(): WorkflowNameReadContext | null;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class WorkflowBodyContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    LBRACE(): antlr.TerminalNode;
    RBRACE(): antlr.TerminalNode;
    workflowContent(): WorkflowContentContext[];
    workflowContent(i: number): WorkflowContentContext | null;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class WorkflowContentContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    dataDefinition(): DataDefinitionContext | null;
    taskDefinition(): TaskDefinitionContext | null;
    taskChain(): TaskChainContext | null;
    taskConfiguration(): TaskConfigurationContext | null;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class DataDefinitionContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    DEFINE(): antlr.TerminalNode;
    DATA(): antlr.TerminalNode;
    IDENTIFIER(): antlr.TerminalNode;
    SEMICOLON(): antlr.TerminalNode;
    EQUALS(): antlr.TerminalNode | null;
    STRING(): antlr.TerminalNode | null;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class TaskDefinitionContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    DEFINE(): antlr.TerminalNode;
    TASK(): antlr.TerminalNode;
    IDENTIFIER(): antlr.TerminalNode;
    SEMICOLON(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class TaskChainContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    chainElement(): ChainElementContext[];
    chainElement(i: number): ChainElementContext | null;
    SEMICOLON(): antlr.TerminalNode;
    ARROW(): antlr.TerminalNode[];
    ARROW(i: number): antlr.TerminalNode | null;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class ChainElementContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    START(): antlr.TerminalNode | null;
    END(): antlr.TerminalNode | null;
    taskNameRead(): TaskNameReadContext | null;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class TaskConfigurationContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    taskConfigurationHeader(): TaskConfigurationHeaderContext;
    taskConfigurationBody(): TaskConfigurationBodyContext;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class TaskConfigurationHeaderContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    CONFIGURE(): antlr.TerminalNode;
    TASK(): antlr.TerminalNode;
    taskNameRead(): TaskNameReadContext;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class TaskConfigurationBodyContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    LBRACE(): antlr.TerminalNode;
    RBRACE(): antlr.TerminalNode;
    configurationContent(): ConfigurationContentContext[];
    configurationContent(i: number): ConfigurationContentContext | null;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class ConfigurationContentContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    implementation(): ImplementationContext | null;
    paramAssignment(): ParamAssignmentContext | null;
    inputStatement(): InputStatementContext | null;
    outputStatement(): OutputStatementContext | null;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class ImplementationContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    IMPLEMENTATION(): antlr.TerminalNode;
    fileNameString(): FileNameStringContext;
    SEMICOLON(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class ParamAssignmentContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    PARAM(): antlr.TerminalNode;
    IDENTIFIER(): antlr.TerminalNode;
    SEMICOLON(): antlr.TerminalNode;
    EQUALS(): antlr.TerminalNode | null;
    expression(): ExpressionContext | null;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class InputStatementContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    INPUT(): antlr.TerminalNode;
    dataNameList(): DataNameListContext;
    SEMICOLON(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class OutputStatementContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    OUTPUT(): antlr.TerminalNode;
    dataNameList(): DataNameListContext;
    SEMICOLON(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class DataNameListContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    dataNameRead(): DataNameReadContext[];
    dataNameRead(i: number): DataNameReadContext | null;
    COMMA(): antlr.TerminalNode[];
    COMMA(i: number): antlr.TerminalNode | null;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class WorkflowNameReadContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    IDENTIFIER(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class DataNameReadContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    IDENTIFIER(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class TaskNameReadContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    IDENTIFIER(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class FileNameStringContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    STRING(): antlr.TerminalNode;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
export declare class ExpressionContext extends antlr.ParserRuleContext {
    constructor(parent: antlr.ParserRuleContext | null, invokingState: number);
    NUMBER(): antlr.TerminalNode | null;
    STRING(): antlr.TerminalNode | null;
    BOOLEAN(): antlr.TerminalNode | null;
    get ruleIndex(): number;
    enterRule(listener: XXPListener): void;
    exitRule(listener: XXPListener): void;
    accept<Result>(visitor: XXPVisitor<Result>): Result | null;
}
//# sourceMappingURL=XXPParser.d.ts.map