// Generated from src/language/grammar/ESPACE.g4 by ANTLR 4.13.1

import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { ESPACEListener } from "./ESPACEListener.js";
import { ESPACEVisitor } from "./ESPACEVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class ESPACEParser extends antlr.Parser {
    public static readonly SEMICOLON = 1;
    public static readonly ARROW = 2;
    public static readonly CONDITION_ARROW = 3;
    public static readonly LBRACE = 4;
    public static readonly RBRACE = 5;
    public static readonly LPAREN = 6;
    public static readonly RPAREN = 7;
    public static readonly EQUALS = 8;
    public static readonly COMMA = 9;
    public static readonly EXPERIMENT = 10;
    public static readonly SPACE = 11;
    public static readonly OF = 12;
    public static readonly STRATEGY = 13;
    public static readonly PARAM = 14;
    public static readonly ENUM = 15;
    public static readonly RANGE = 16;
    public static readonly CONFIGURE = 17;
    public static readonly TASK = 18;
    public static readonly CONTROL = 19;
    public static readonly CONDITION = 20;
    public static readonly DEFINE = 21;
    public static readonly DATA = 22;
    public static readonly START = 23;
    public static readonly END = 24;
    public static readonly BOOLEAN = 25;
    public static readonly IDENTIFIER = 26;
    public static readonly STRING = 27;
    public static readonly NUMBER = 28;
    public static readonly WS = 29;
    public static readonly COMMENT = 30;
    public static readonly RULE_program = 0;
    public static readonly RULE_experimentDeclaration = 1;
    public static readonly RULE_experimentHeader = 2;
    public static readonly RULE_experimentBody = 3;
    public static readonly RULE_experimentContent = 4;
    public static readonly RULE_spaceDeclaration = 5;
    public static readonly RULE_spaceHeader = 6;
    public static readonly RULE_spaceBody = 7;
    public static readonly RULE_spaceContent = 8;
    public static readonly RULE_strategyStatement = 9;
    public static readonly RULE_paramDefinition = 10;
    public static readonly RULE_paramValue = 11;
    public static readonly RULE_enumFunction = 12;
    public static readonly RULE_rangeFunction = 13;
    public static readonly RULE_taskConfiguration = 14;
    public static readonly RULE_taskConfigurationHeader = 15;
    public static readonly RULE_taskConfigurationBody = 16;
    public static readonly RULE_configurationContent = 17;
    public static readonly RULE_paramAssignment = 18;
    public static readonly RULE_controlBlock = 19;
    public static readonly RULE_controlBody = 20;
    public static readonly RULE_controlContent = 21;
    public static readonly RULE_simpleTransition = 22;
    public static readonly RULE_conditionalTransition = 23;
    public static readonly RULE_conditionalTransitionHeader = 24;
    public static readonly RULE_conditionalTransitionBody = 25;
    public static readonly RULE_condition = 26;
    public static readonly RULE_controlChainElement = 27;
    public static readonly RULE_dataDefinition = 28;
    public static readonly RULE_workflowNameRead = 29;
    public static readonly RULE_taskNameRead = 30;
    public static readonly RULE_spaceNameRead = 31;
    public static readonly RULE_expression = 32;

    public static readonly literalNames = [
        null, "';'", "'->'", "'-?>'", "'{'", "'}'", "'('", "')'", "'='", 
        "','", "'experiment'", "'space'", "'of'", "'strategy'", "'param'", 
        "'enum'", "'range'", "'configure'", "'task'", "'control'", "'condition'", 
        "'define'", "'data'", "'start'", "'end'"
    ];

    public static readonly symbolicNames = [
        null, "SEMICOLON", "ARROW", "CONDITION_ARROW", "LBRACE", "RBRACE", 
        "LPAREN", "RPAREN", "EQUALS", "COMMA", "EXPERIMENT", "SPACE", "OF", 
        "STRATEGY", "PARAM", "ENUM", "RANGE", "CONFIGURE", "TASK", "CONTROL", 
        "CONDITION", "DEFINE", "DATA", "START", "END", "BOOLEAN", "IDENTIFIER", 
        "STRING", "NUMBER", "WS", "COMMENT"
    ];
    public static readonly ruleNames = [
        "program", "experimentDeclaration", "experimentHeader", "experimentBody", 
        "experimentContent", "spaceDeclaration", "spaceHeader", "spaceBody", 
        "spaceContent", "strategyStatement", "paramDefinition", "paramValue", 
        "enumFunction", "rangeFunction", "taskConfiguration", "taskConfigurationHeader", 
        "taskConfigurationBody", "configurationContent", "paramAssignment", 
        "controlBlock", "controlBody", "controlContent", "simpleTransition", 
        "conditionalTransition", "conditionalTransitionHeader", "conditionalTransitionBody", 
        "condition", "controlChainElement", "dataDefinition", "workflowNameRead", 
        "taskNameRead", "spaceNameRead", "expression",
    ];

    public get grammarFileName(): string { return "ESPACE.g4"; }
    public get literalNames(): (string | null)[] { return ESPACEParser.literalNames; }
    public get symbolicNames(): (string | null)[] { return ESPACEParser.symbolicNames; }
    public get ruleNames(): string[] { return ESPACEParser.ruleNames; }
    public get serializedATN(): number[] { return ESPACEParser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, ESPACEParser._ATN, ESPACEParser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public program(): ProgramContext {
        let localContext = new ProgramContext(this.context, this.state);
        this.enterRule(localContext, 0, ESPACEParser.RULE_program);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 66;
            this.experimentDeclaration();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public experimentDeclaration(): ExperimentDeclarationContext {
        let localContext = new ExperimentDeclarationContext(this.context, this.state);
        this.enterRule(localContext, 2, ESPACEParser.RULE_experimentDeclaration);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 68;
            this.experimentHeader();
            this.state = 69;
            this.experimentBody();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public experimentHeader(): ExperimentHeaderContext {
        let localContext = new ExperimentHeaderContext(this.context, this.state);
        this.enterRule(localContext, 4, ESPACEParser.RULE_experimentHeader);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 71;
            this.match(ESPACEParser.EXPERIMENT);
            this.state = 72;
            this.match(ESPACEParser.IDENTIFIER);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public experimentBody(): ExperimentBodyContext {
        let localContext = new ExperimentBodyContext(this.context, this.state);
        this.enterRule(localContext, 6, ESPACEParser.RULE_experimentBody);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 74;
            this.match(ESPACEParser.LBRACE);
            this.state = 78;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 2623488) !== 0)) {
                {
                {
                this.state = 75;
                this.experimentContent();
                }
                }
                this.state = 80;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 81;
            this.match(ESPACEParser.RBRACE);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public experimentContent(): ExperimentContentContext {
        let localContext = new ExperimentContentContext(this.context, this.state);
        this.enterRule(localContext, 8, ESPACEParser.RULE_experimentContent);
        try {
            this.state = 86;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case ESPACEParser.SPACE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 83;
                this.spaceDeclaration();
                }
                break;
            case ESPACEParser.CONTROL:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 84;
                this.controlBlock();
                }
                break;
            case ESPACEParser.DEFINE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 85;
                this.dataDefinition();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public spaceDeclaration(): SpaceDeclarationContext {
        let localContext = new SpaceDeclarationContext(this.context, this.state);
        this.enterRule(localContext, 10, ESPACEParser.RULE_spaceDeclaration);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 88;
            this.spaceHeader();
            this.state = 89;
            this.spaceBody();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public spaceHeader(): SpaceHeaderContext {
        let localContext = new SpaceHeaderContext(this.context, this.state);
        this.enterRule(localContext, 12, ESPACEParser.RULE_spaceHeader);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 91;
            this.match(ESPACEParser.SPACE);
            this.state = 92;
            this.match(ESPACEParser.IDENTIFIER);
            this.state = 93;
            this.match(ESPACEParser.OF);
            this.state = 94;
            this.workflowNameRead();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public spaceBody(): SpaceBodyContext {
        let localContext = new SpaceBodyContext(this.context, this.state);
        this.enterRule(localContext, 14, ESPACEParser.RULE_spaceBody);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 96;
            this.match(ESPACEParser.LBRACE);
            this.state = 100;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 2252800) !== 0)) {
                {
                {
                this.state = 97;
                this.spaceContent();
                }
                }
                this.state = 102;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 103;
            this.match(ESPACEParser.RBRACE);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public spaceContent(): SpaceContentContext {
        let localContext = new SpaceContentContext(this.context, this.state);
        this.enterRule(localContext, 16, ESPACEParser.RULE_spaceContent);
        try {
            this.state = 109;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case ESPACEParser.STRATEGY:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 105;
                this.strategyStatement();
                }
                break;
            case ESPACEParser.PARAM:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 106;
                this.paramDefinition();
                }
                break;
            case ESPACEParser.CONFIGURE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 107;
                this.taskConfiguration();
                }
                break;
            case ESPACEParser.DEFINE:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 108;
                this.dataDefinition();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public strategyStatement(): StrategyStatementContext {
        let localContext = new StrategyStatementContext(this.context, this.state);
        this.enterRule(localContext, 18, ESPACEParser.RULE_strategyStatement);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 111;
            this.match(ESPACEParser.STRATEGY);
            this.state = 112;
            this.match(ESPACEParser.IDENTIFIER);
            this.state = 113;
            this.match(ESPACEParser.SEMICOLON);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public paramDefinition(): ParamDefinitionContext {
        let localContext = new ParamDefinitionContext(this.context, this.state);
        this.enterRule(localContext, 20, ESPACEParser.RULE_paramDefinition);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 115;
            this.match(ESPACEParser.PARAM);
            this.state = 116;
            this.match(ESPACEParser.IDENTIFIER);
            this.state = 117;
            this.match(ESPACEParser.EQUALS);
            this.state = 118;
            this.paramValue();
            this.state = 119;
            this.match(ESPACEParser.SEMICOLON);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public paramValue(): ParamValueContext {
        let localContext = new ParamValueContext(this.context, this.state);
        this.enterRule(localContext, 22, ESPACEParser.RULE_paramValue);
        try {
            this.state = 124;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case ESPACEParser.ENUM:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 121;
                this.enumFunction();
                }
                break;
            case ESPACEParser.RANGE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 122;
                this.rangeFunction();
                }
                break;
            case ESPACEParser.BOOLEAN:
            case ESPACEParser.STRING:
            case ESPACEParser.NUMBER:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 123;
                this.expression();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public enumFunction(): EnumFunctionContext {
        let localContext = new EnumFunctionContext(this.context, this.state);
        this.enterRule(localContext, 24, ESPACEParser.RULE_enumFunction);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 126;
            this.match(ESPACEParser.ENUM);
            this.state = 127;
            this.match(ESPACEParser.LPAREN);
            this.state = 128;
            this.expression();
            this.state = 133;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 9) {
                {
                {
                this.state = 129;
                this.match(ESPACEParser.COMMA);
                this.state = 130;
                this.expression();
                }
                }
                this.state = 135;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 136;
            this.match(ESPACEParser.RPAREN);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public rangeFunction(): RangeFunctionContext {
        let localContext = new RangeFunctionContext(this.context, this.state);
        this.enterRule(localContext, 26, ESPACEParser.RULE_rangeFunction);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 138;
            this.match(ESPACEParser.RANGE);
            this.state = 139;
            this.match(ESPACEParser.LPAREN);
            this.state = 140;
            this.match(ESPACEParser.NUMBER);
            this.state = 141;
            this.match(ESPACEParser.COMMA);
            this.state = 142;
            this.match(ESPACEParser.NUMBER);
            this.state = 143;
            this.match(ESPACEParser.COMMA);
            this.state = 144;
            this.match(ESPACEParser.NUMBER);
            this.state = 145;
            this.match(ESPACEParser.RPAREN);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public taskConfiguration(): TaskConfigurationContext {
        let localContext = new TaskConfigurationContext(this.context, this.state);
        this.enterRule(localContext, 28, ESPACEParser.RULE_taskConfiguration);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 147;
            this.taskConfigurationHeader();
            this.state = 148;
            this.taskConfigurationBody();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public taskConfigurationHeader(): TaskConfigurationHeaderContext {
        let localContext = new TaskConfigurationHeaderContext(this.context, this.state);
        this.enterRule(localContext, 30, ESPACEParser.RULE_taskConfigurationHeader);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 150;
            this.match(ESPACEParser.CONFIGURE);
            this.state = 151;
            this.match(ESPACEParser.TASK);
            this.state = 152;
            this.taskNameRead();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public taskConfigurationBody(): TaskConfigurationBodyContext {
        let localContext = new TaskConfigurationBodyContext(this.context, this.state);
        this.enterRule(localContext, 32, ESPACEParser.RULE_taskConfigurationBody);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 154;
            this.match(ESPACEParser.LBRACE);
            this.state = 158;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 14) {
                {
                {
                this.state = 155;
                this.configurationContent();
                }
                }
                this.state = 160;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 161;
            this.match(ESPACEParser.RBRACE);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public configurationContent(): ConfigurationContentContext {
        let localContext = new ConfigurationContentContext(this.context, this.state);
        this.enterRule(localContext, 34, ESPACEParser.RULE_configurationContent);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 163;
            this.paramAssignment();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public paramAssignment(): ParamAssignmentContext {
        let localContext = new ParamAssignmentContext(this.context, this.state);
        this.enterRule(localContext, 36, ESPACEParser.RULE_paramAssignment);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 165;
            this.match(ESPACEParser.PARAM);
            this.state = 166;
            this.match(ESPACEParser.IDENTIFIER);
            this.state = 167;
            this.match(ESPACEParser.EQUALS);
            this.state = 168;
            this.paramValue();
            this.state = 169;
            this.match(ESPACEParser.SEMICOLON);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public controlBlock(): ControlBlockContext {
        let localContext = new ControlBlockContext(this.context, this.state);
        this.enterRule(localContext, 38, ESPACEParser.RULE_controlBlock);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 171;
            this.match(ESPACEParser.CONTROL);
            this.state = 172;
            this.controlBody();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public controlBody(): ControlBodyContext {
        let localContext = new ControlBodyContext(this.context, this.state);
        this.enterRule(localContext, 40, ESPACEParser.RULE_controlBody);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 174;
            this.match(ESPACEParser.LBRACE);
            this.state = 178;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 92274688) !== 0)) {
                {
                {
                this.state = 175;
                this.controlContent();
                }
                }
                this.state = 180;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 181;
            this.match(ESPACEParser.RBRACE);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public controlContent(): ControlContentContext {
        let localContext = new ControlContentContext(this.context, this.state);
        this.enterRule(localContext, 42, ESPACEParser.RULE_controlContent);
        try {
            this.state = 185;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 8, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 183;
                this.simpleTransition();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 184;
                this.conditionalTransition();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public simpleTransition(): SimpleTransitionContext {
        let localContext = new SimpleTransitionContext(this.context, this.state);
        this.enterRule(localContext, 44, ESPACEParser.RULE_simpleTransition);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 187;
            this.controlChainElement();
            this.state = 190;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 188;
                this.match(ESPACEParser.ARROW);
                this.state = 189;
                this.controlChainElement();
                }
                }
                this.state = 192;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while (_la === 2);
            this.state = 194;
            this.match(ESPACEParser.SEMICOLON);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public conditionalTransition(): ConditionalTransitionContext {
        let localContext = new ConditionalTransitionContext(this.context, this.state);
        this.enterRule(localContext, 46, ESPACEParser.RULE_conditionalTransition);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 196;
            this.conditionalTransitionHeader();
            this.state = 197;
            this.conditionalTransitionBody();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public conditionalTransitionHeader(): ConditionalTransitionHeaderContext {
        let localContext = new ConditionalTransitionHeaderContext(this.context, this.state);
        this.enterRule(localContext, 48, ESPACEParser.RULE_conditionalTransitionHeader);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 199;
            this.controlChainElement();
            this.state = 200;
            this.match(ESPACEParser.CONDITION_ARROW);
            this.state = 201;
            this.controlChainElement();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public conditionalTransitionBody(): ConditionalTransitionBodyContext {
        let localContext = new ConditionalTransitionBodyContext(this.context, this.state);
        this.enterRule(localContext, 50, ESPACEParser.RULE_conditionalTransitionBody);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 203;
            this.match(ESPACEParser.LBRACE);
            this.state = 207;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 20) {
                {
                {
                this.state = 204;
                this.condition();
                }
                }
                this.state = 209;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 210;
            this.match(ESPACEParser.RBRACE);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public condition(): ConditionContext {
        let localContext = new ConditionContext(this.context, this.state);
        this.enterRule(localContext, 52, ESPACEParser.RULE_condition);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 212;
            this.match(ESPACEParser.CONDITION);
            this.state = 213;
            this.match(ESPACEParser.STRING);
            this.state = 214;
            this.match(ESPACEParser.SEMICOLON);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public controlChainElement(): ControlChainElementContext {
        let localContext = new ControlChainElementContext(this.context, this.state);
        this.enterRule(localContext, 54, ESPACEParser.RULE_controlChainElement);
        try {
            this.state = 219;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case ESPACEParser.START:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 216;
                this.match(ESPACEParser.START);
                }
                break;
            case ESPACEParser.END:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 217;
                this.match(ESPACEParser.END);
                }
                break;
            case ESPACEParser.IDENTIFIER:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 218;
                this.spaceNameRead();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public dataDefinition(): DataDefinitionContext {
        let localContext = new DataDefinitionContext(this.context, this.state);
        this.enterRule(localContext, 56, ESPACEParser.RULE_dataDefinition);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 221;
            this.match(ESPACEParser.DEFINE);
            this.state = 222;
            this.match(ESPACEParser.DATA);
            this.state = 223;
            this.match(ESPACEParser.IDENTIFIER);
            this.state = 224;
            this.match(ESPACEParser.EQUALS);
            this.state = 225;
            this.match(ESPACEParser.STRING);
            this.state = 226;
            this.match(ESPACEParser.SEMICOLON);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public workflowNameRead(): WorkflowNameReadContext {
        let localContext = new WorkflowNameReadContext(this.context, this.state);
        this.enterRule(localContext, 58, ESPACEParser.RULE_workflowNameRead);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 228;
            this.match(ESPACEParser.IDENTIFIER);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public taskNameRead(): TaskNameReadContext {
        let localContext = new TaskNameReadContext(this.context, this.state);
        this.enterRule(localContext, 60, ESPACEParser.RULE_taskNameRead);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 230;
            this.match(ESPACEParser.IDENTIFIER);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public spaceNameRead(): SpaceNameReadContext {
        let localContext = new SpaceNameReadContext(this.context, this.state);
        this.enterRule(localContext, 62, ESPACEParser.RULE_spaceNameRead);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 232;
            this.match(ESPACEParser.IDENTIFIER);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public expression(): ExpressionContext {
        let localContext = new ExpressionContext(this.context, this.state);
        this.enterRule(localContext, 64, ESPACEParser.RULE_expression);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 234;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 436207616) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }

    public static readonly _serializedATN: number[] = [
        4,1,30,237,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,20,
        7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,26,
        2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,1,0,
        1,0,1,1,1,1,1,1,1,2,1,2,1,2,1,3,1,3,5,3,77,8,3,10,3,12,3,80,9,3,
        1,3,1,3,1,4,1,4,1,4,3,4,87,8,4,1,5,1,5,1,5,1,6,1,6,1,6,1,6,1,6,1,
        7,1,7,5,7,99,8,7,10,7,12,7,102,9,7,1,7,1,7,1,8,1,8,1,8,1,8,3,8,110,
        8,8,1,9,1,9,1,9,1,9,1,10,1,10,1,10,1,10,1,10,1,10,1,11,1,11,1,11,
        3,11,125,8,11,1,12,1,12,1,12,1,12,1,12,5,12,132,8,12,10,12,12,12,
        135,9,12,1,12,1,12,1,13,1,13,1,13,1,13,1,13,1,13,1,13,1,13,1,13,
        1,14,1,14,1,14,1,15,1,15,1,15,1,15,1,16,1,16,5,16,157,8,16,10,16,
        12,16,160,9,16,1,16,1,16,1,17,1,17,1,18,1,18,1,18,1,18,1,18,1,18,
        1,19,1,19,1,19,1,20,1,20,5,20,177,8,20,10,20,12,20,180,9,20,1,20,
        1,20,1,21,1,21,3,21,186,8,21,1,22,1,22,1,22,4,22,191,8,22,11,22,
        12,22,192,1,22,1,22,1,23,1,23,1,23,1,24,1,24,1,24,1,24,1,25,1,25,
        5,25,206,8,25,10,25,12,25,209,9,25,1,25,1,25,1,26,1,26,1,26,1,26,
        1,27,1,27,1,27,3,27,220,8,27,1,28,1,28,1,28,1,28,1,28,1,28,1,28,
        1,29,1,29,1,30,1,30,1,31,1,31,1,32,1,32,1,32,0,0,33,0,2,4,6,8,10,
        12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,
        56,58,60,62,64,0,1,2,0,25,25,27,28,220,0,66,1,0,0,0,2,68,1,0,0,0,
        4,71,1,0,0,0,6,74,1,0,0,0,8,86,1,0,0,0,10,88,1,0,0,0,12,91,1,0,0,
        0,14,96,1,0,0,0,16,109,1,0,0,0,18,111,1,0,0,0,20,115,1,0,0,0,22,
        124,1,0,0,0,24,126,1,0,0,0,26,138,1,0,0,0,28,147,1,0,0,0,30,150,
        1,0,0,0,32,154,1,0,0,0,34,163,1,0,0,0,36,165,1,0,0,0,38,171,1,0,
        0,0,40,174,1,0,0,0,42,185,1,0,0,0,44,187,1,0,0,0,46,196,1,0,0,0,
        48,199,1,0,0,0,50,203,1,0,0,0,52,212,1,0,0,0,54,219,1,0,0,0,56,221,
        1,0,0,0,58,228,1,0,0,0,60,230,1,0,0,0,62,232,1,0,0,0,64,234,1,0,
        0,0,66,67,3,2,1,0,67,1,1,0,0,0,68,69,3,4,2,0,69,70,3,6,3,0,70,3,
        1,0,0,0,71,72,5,10,0,0,72,73,5,26,0,0,73,5,1,0,0,0,74,78,5,4,0,0,
        75,77,3,8,4,0,76,75,1,0,0,0,77,80,1,0,0,0,78,76,1,0,0,0,78,79,1,
        0,0,0,79,81,1,0,0,0,80,78,1,0,0,0,81,82,5,5,0,0,82,7,1,0,0,0,83,
        87,3,10,5,0,84,87,3,38,19,0,85,87,3,56,28,0,86,83,1,0,0,0,86,84,
        1,0,0,0,86,85,1,0,0,0,87,9,1,0,0,0,88,89,3,12,6,0,89,90,3,14,7,0,
        90,11,1,0,0,0,91,92,5,11,0,0,92,93,5,26,0,0,93,94,5,12,0,0,94,95,
        3,58,29,0,95,13,1,0,0,0,96,100,5,4,0,0,97,99,3,16,8,0,98,97,1,0,
        0,0,99,102,1,0,0,0,100,98,1,0,0,0,100,101,1,0,0,0,101,103,1,0,0,
        0,102,100,1,0,0,0,103,104,5,5,0,0,104,15,1,0,0,0,105,110,3,18,9,
        0,106,110,3,20,10,0,107,110,3,28,14,0,108,110,3,56,28,0,109,105,
        1,0,0,0,109,106,1,0,0,0,109,107,1,0,0,0,109,108,1,0,0,0,110,17,1,
        0,0,0,111,112,5,13,0,0,112,113,5,26,0,0,113,114,5,1,0,0,114,19,1,
        0,0,0,115,116,5,14,0,0,116,117,5,26,0,0,117,118,5,8,0,0,118,119,
        3,22,11,0,119,120,5,1,0,0,120,21,1,0,0,0,121,125,3,24,12,0,122,125,
        3,26,13,0,123,125,3,64,32,0,124,121,1,0,0,0,124,122,1,0,0,0,124,
        123,1,0,0,0,125,23,1,0,0,0,126,127,5,15,0,0,127,128,5,6,0,0,128,
        133,3,64,32,0,129,130,5,9,0,0,130,132,3,64,32,0,131,129,1,0,0,0,
        132,135,1,0,0,0,133,131,1,0,0,0,133,134,1,0,0,0,134,136,1,0,0,0,
        135,133,1,0,0,0,136,137,5,7,0,0,137,25,1,0,0,0,138,139,5,16,0,0,
        139,140,5,6,0,0,140,141,5,28,0,0,141,142,5,9,0,0,142,143,5,28,0,
        0,143,144,5,9,0,0,144,145,5,28,0,0,145,146,5,7,0,0,146,27,1,0,0,
        0,147,148,3,30,15,0,148,149,3,32,16,0,149,29,1,0,0,0,150,151,5,17,
        0,0,151,152,5,18,0,0,152,153,3,60,30,0,153,31,1,0,0,0,154,158,5,
        4,0,0,155,157,3,34,17,0,156,155,1,0,0,0,157,160,1,0,0,0,158,156,
        1,0,0,0,158,159,1,0,0,0,159,161,1,0,0,0,160,158,1,0,0,0,161,162,
        5,5,0,0,162,33,1,0,0,0,163,164,3,36,18,0,164,35,1,0,0,0,165,166,
        5,14,0,0,166,167,5,26,0,0,167,168,5,8,0,0,168,169,3,22,11,0,169,
        170,5,1,0,0,170,37,1,0,0,0,171,172,5,19,0,0,172,173,3,40,20,0,173,
        39,1,0,0,0,174,178,5,4,0,0,175,177,3,42,21,0,176,175,1,0,0,0,177,
        180,1,0,0,0,178,176,1,0,0,0,178,179,1,0,0,0,179,181,1,0,0,0,180,
        178,1,0,0,0,181,182,5,5,0,0,182,41,1,0,0,0,183,186,3,44,22,0,184,
        186,3,46,23,0,185,183,1,0,0,0,185,184,1,0,0,0,186,43,1,0,0,0,187,
        190,3,54,27,0,188,189,5,2,0,0,189,191,3,54,27,0,190,188,1,0,0,0,
        191,192,1,0,0,0,192,190,1,0,0,0,192,193,1,0,0,0,193,194,1,0,0,0,
        194,195,5,1,0,0,195,45,1,0,0,0,196,197,3,48,24,0,197,198,3,50,25,
        0,198,47,1,0,0,0,199,200,3,54,27,0,200,201,5,3,0,0,201,202,3,54,
        27,0,202,49,1,0,0,0,203,207,5,4,0,0,204,206,3,52,26,0,205,204,1,
        0,0,0,206,209,1,0,0,0,207,205,1,0,0,0,207,208,1,0,0,0,208,210,1,
        0,0,0,209,207,1,0,0,0,210,211,5,5,0,0,211,51,1,0,0,0,212,213,5,20,
        0,0,213,214,5,27,0,0,214,215,5,1,0,0,215,53,1,0,0,0,216,220,5,23,
        0,0,217,220,5,24,0,0,218,220,3,62,31,0,219,216,1,0,0,0,219,217,1,
        0,0,0,219,218,1,0,0,0,220,55,1,0,0,0,221,222,5,21,0,0,222,223,5,
        22,0,0,223,224,5,26,0,0,224,225,5,8,0,0,225,226,5,27,0,0,226,227,
        5,1,0,0,227,57,1,0,0,0,228,229,5,26,0,0,229,59,1,0,0,0,230,231,5,
        26,0,0,231,61,1,0,0,0,232,233,5,26,0,0,233,63,1,0,0,0,234,235,7,
        0,0,0,235,65,1,0,0,0,12,78,86,100,109,124,133,158,178,185,192,207,
        219
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!ESPACEParser.__ATN) {
            ESPACEParser.__ATN = new antlr.ATNDeserializer().deserialize(ESPACEParser._serializedATN);
        }

        return ESPACEParser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(ESPACEParser.literalNames, ESPACEParser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return ESPACEParser.vocabulary;
    }

    private static readonly decisionsToDFA = ESPACEParser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class ProgramContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public experimentDeclaration(): ExperimentDeclarationContext {
        return this.getRuleContext(0, ExperimentDeclarationContext)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_program;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterProgram) {
             listener.enterProgram(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitProgram) {
             listener.exitProgram(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitProgram) {
            return visitor.visitProgram(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ExperimentDeclarationContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public experimentHeader(): ExperimentHeaderContext {
        return this.getRuleContext(0, ExperimentHeaderContext)!;
    }
    public experimentBody(): ExperimentBodyContext {
        return this.getRuleContext(0, ExperimentBodyContext)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_experimentDeclaration;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterExperimentDeclaration) {
             listener.enterExperimentDeclaration(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitExperimentDeclaration) {
             listener.exitExperimentDeclaration(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitExperimentDeclaration) {
            return visitor.visitExperimentDeclaration(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ExperimentHeaderContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EXPERIMENT(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.EXPERIMENT, 0)!;
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.IDENTIFIER, 0)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_experimentHeader;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterExperimentHeader) {
             listener.enterExperimentHeader(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitExperimentHeader) {
             listener.exitExperimentHeader(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitExperimentHeader) {
            return visitor.visitExperimentHeader(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ExperimentBodyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LBRACE(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.LBRACE, 0)!;
    }
    public RBRACE(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.RBRACE, 0)!;
    }
    public experimentContent(): ExperimentContentContext[];
    public experimentContent(i: number): ExperimentContentContext | null;
    public experimentContent(i?: number): ExperimentContentContext[] | ExperimentContentContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExperimentContentContext);
        }

        return this.getRuleContext(i, ExperimentContentContext);
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_experimentBody;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterExperimentBody) {
             listener.enterExperimentBody(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitExperimentBody) {
             listener.exitExperimentBody(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitExperimentBody) {
            return visitor.visitExperimentBody(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ExperimentContentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public spaceDeclaration(): SpaceDeclarationContext | null {
        return this.getRuleContext(0, SpaceDeclarationContext);
    }
    public controlBlock(): ControlBlockContext | null {
        return this.getRuleContext(0, ControlBlockContext);
    }
    public dataDefinition(): DataDefinitionContext | null {
        return this.getRuleContext(0, DataDefinitionContext);
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_experimentContent;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterExperimentContent) {
             listener.enterExperimentContent(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitExperimentContent) {
             listener.exitExperimentContent(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitExperimentContent) {
            return visitor.visitExperimentContent(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SpaceDeclarationContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public spaceHeader(): SpaceHeaderContext {
        return this.getRuleContext(0, SpaceHeaderContext)!;
    }
    public spaceBody(): SpaceBodyContext {
        return this.getRuleContext(0, SpaceBodyContext)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_spaceDeclaration;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterSpaceDeclaration) {
             listener.enterSpaceDeclaration(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitSpaceDeclaration) {
             listener.exitSpaceDeclaration(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitSpaceDeclaration) {
            return visitor.visitSpaceDeclaration(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SpaceHeaderContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SPACE(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.SPACE, 0)!;
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.IDENTIFIER, 0)!;
    }
    public OF(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.OF, 0)!;
    }
    public workflowNameRead(): WorkflowNameReadContext {
        return this.getRuleContext(0, WorkflowNameReadContext)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_spaceHeader;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterSpaceHeader) {
             listener.enterSpaceHeader(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitSpaceHeader) {
             listener.exitSpaceHeader(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitSpaceHeader) {
            return visitor.visitSpaceHeader(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SpaceBodyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LBRACE(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.LBRACE, 0)!;
    }
    public RBRACE(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.RBRACE, 0)!;
    }
    public spaceContent(): SpaceContentContext[];
    public spaceContent(i: number): SpaceContentContext | null;
    public spaceContent(i?: number): SpaceContentContext[] | SpaceContentContext | null {
        if (i === undefined) {
            return this.getRuleContexts(SpaceContentContext);
        }

        return this.getRuleContext(i, SpaceContentContext);
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_spaceBody;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterSpaceBody) {
             listener.enterSpaceBody(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitSpaceBody) {
             listener.exitSpaceBody(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitSpaceBody) {
            return visitor.visitSpaceBody(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SpaceContentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public strategyStatement(): StrategyStatementContext | null {
        return this.getRuleContext(0, StrategyStatementContext);
    }
    public paramDefinition(): ParamDefinitionContext | null {
        return this.getRuleContext(0, ParamDefinitionContext);
    }
    public taskConfiguration(): TaskConfigurationContext | null {
        return this.getRuleContext(0, TaskConfigurationContext);
    }
    public dataDefinition(): DataDefinitionContext | null {
        return this.getRuleContext(0, DataDefinitionContext);
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_spaceContent;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterSpaceContent) {
             listener.enterSpaceContent(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitSpaceContent) {
             listener.exitSpaceContent(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitSpaceContent) {
            return visitor.visitSpaceContent(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class StrategyStatementContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public STRATEGY(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.STRATEGY, 0)!;
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.IDENTIFIER, 0)!;
    }
    public SEMICOLON(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.SEMICOLON, 0)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_strategyStatement;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterStrategyStatement) {
             listener.enterStrategyStatement(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitStrategyStatement) {
             listener.exitStrategyStatement(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitStrategyStatement) {
            return visitor.visitStrategyStatement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ParamDefinitionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PARAM(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.PARAM, 0)!;
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.IDENTIFIER, 0)!;
    }
    public EQUALS(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.EQUALS, 0)!;
    }
    public paramValue(): ParamValueContext {
        return this.getRuleContext(0, ParamValueContext)!;
    }
    public SEMICOLON(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.SEMICOLON, 0)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_paramDefinition;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterParamDefinition) {
             listener.enterParamDefinition(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitParamDefinition) {
             listener.exitParamDefinition(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitParamDefinition) {
            return visitor.visitParamDefinition(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ParamValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public enumFunction(): EnumFunctionContext | null {
        return this.getRuleContext(0, EnumFunctionContext);
    }
    public rangeFunction(): RangeFunctionContext | null {
        return this.getRuleContext(0, RangeFunctionContext);
    }
    public expression(): ExpressionContext | null {
        return this.getRuleContext(0, ExpressionContext);
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_paramValue;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterParamValue) {
             listener.enterParamValue(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitParamValue) {
             listener.exitParamValue(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitParamValue) {
            return visitor.visitParamValue(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class EnumFunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ENUM(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.ENUM, 0)!;
    }
    public LPAREN(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.LPAREN, 0)!;
    }
    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext | null;
    public expression(i?: number): ExpressionContext[] | ExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        }

        return this.getRuleContext(i, ExpressionContext);
    }
    public RPAREN(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.RPAREN, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(ESPACEParser.COMMA);
    	} else {
    		return this.getToken(ESPACEParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_enumFunction;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterEnumFunction) {
             listener.enterEnumFunction(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitEnumFunction) {
             listener.exitEnumFunction(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitEnumFunction) {
            return visitor.visitEnumFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RangeFunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public RANGE(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.RANGE, 0)!;
    }
    public LPAREN(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.LPAREN, 0)!;
    }
    public NUMBER(): antlr.TerminalNode[];
    public NUMBER(i: number): antlr.TerminalNode | null;
    public NUMBER(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(ESPACEParser.NUMBER);
    	} else {
    		return this.getToken(ESPACEParser.NUMBER, i);
    	}
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(ESPACEParser.COMMA);
    	} else {
    		return this.getToken(ESPACEParser.COMMA, i);
    	}
    }
    public RPAREN(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.RPAREN, 0)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_rangeFunction;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterRangeFunction) {
             listener.enterRangeFunction(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitRangeFunction) {
             listener.exitRangeFunction(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitRangeFunction) {
            return visitor.visitRangeFunction(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TaskConfigurationContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public taskConfigurationHeader(): TaskConfigurationHeaderContext {
        return this.getRuleContext(0, TaskConfigurationHeaderContext)!;
    }
    public taskConfigurationBody(): TaskConfigurationBodyContext {
        return this.getRuleContext(0, TaskConfigurationBodyContext)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_taskConfiguration;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterTaskConfiguration) {
             listener.enterTaskConfiguration(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitTaskConfiguration) {
             listener.exitTaskConfiguration(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitTaskConfiguration) {
            return visitor.visitTaskConfiguration(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TaskConfigurationHeaderContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public CONFIGURE(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.CONFIGURE, 0)!;
    }
    public TASK(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.TASK, 0)!;
    }
    public taskNameRead(): TaskNameReadContext {
        return this.getRuleContext(0, TaskNameReadContext)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_taskConfigurationHeader;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterTaskConfigurationHeader) {
             listener.enterTaskConfigurationHeader(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitTaskConfigurationHeader) {
             listener.exitTaskConfigurationHeader(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitTaskConfigurationHeader) {
            return visitor.visitTaskConfigurationHeader(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TaskConfigurationBodyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LBRACE(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.LBRACE, 0)!;
    }
    public RBRACE(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.RBRACE, 0)!;
    }
    public configurationContent(): ConfigurationContentContext[];
    public configurationContent(i: number): ConfigurationContentContext | null;
    public configurationContent(i?: number): ConfigurationContentContext[] | ConfigurationContentContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ConfigurationContentContext);
        }

        return this.getRuleContext(i, ConfigurationContentContext);
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_taskConfigurationBody;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterTaskConfigurationBody) {
             listener.enterTaskConfigurationBody(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitTaskConfigurationBody) {
             listener.exitTaskConfigurationBody(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitTaskConfigurationBody) {
            return visitor.visitTaskConfigurationBody(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ConfigurationContentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public paramAssignment(): ParamAssignmentContext {
        return this.getRuleContext(0, ParamAssignmentContext)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_configurationContent;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterConfigurationContent) {
             listener.enterConfigurationContent(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitConfigurationContent) {
             listener.exitConfigurationContent(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitConfigurationContent) {
            return visitor.visitConfigurationContent(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ParamAssignmentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PARAM(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.PARAM, 0)!;
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.IDENTIFIER, 0)!;
    }
    public EQUALS(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.EQUALS, 0)!;
    }
    public paramValue(): ParamValueContext {
        return this.getRuleContext(0, ParamValueContext)!;
    }
    public SEMICOLON(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.SEMICOLON, 0)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_paramAssignment;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterParamAssignment) {
             listener.enterParamAssignment(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitParamAssignment) {
             listener.exitParamAssignment(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitParamAssignment) {
            return visitor.visitParamAssignment(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ControlBlockContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public CONTROL(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.CONTROL, 0)!;
    }
    public controlBody(): ControlBodyContext {
        return this.getRuleContext(0, ControlBodyContext)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_controlBlock;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterControlBlock) {
             listener.enterControlBlock(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitControlBlock) {
             listener.exitControlBlock(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitControlBlock) {
            return visitor.visitControlBlock(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ControlBodyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LBRACE(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.LBRACE, 0)!;
    }
    public RBRACE(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.RBRACE, 0)!;
    }
    public controlContent(): ControlContentContext[];
    public controlContent(i: number): ControlContentContext | null;
    public controlContent(i?: number): ControlContentContext[] | ControlContentContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ControlContentContext);
        }

        return this.getRuleContext(i, ControlContentContext);
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_controlBody;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterControlBody) {
             listener.enterControlBody(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitControlBody) {
             listener.exitControlBody(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitControlBody) {
            return visitor.visitControlBody(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ControlContentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public simpleTransition(): SimpleTransitionContext | null {
        return this.getRuleContext(0, SimpleTransitionContext);
    }
    public conditionalTransition(): ConditionalTransitionContext | null {
        return this.getRuleContext(0, ConditionalTransitionContext);
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_controlContent;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterControlContent) {
             listener.enterControlContent(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitControlContent) {
             listener.exitControlContent(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitControlContent) {
            return visitor.visitControlContent(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SimpleTransitionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public controlChainElement(): ControlChainElementContext[];
    public controlChainElement(i: number): ControlChainElementContext | null;
    public controlChainElement(i?: number): ControlChainElementContext[] | ControlChainElementContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ControlChainElementContext);
        }

        return this.getRuleContext(i, ControlChainElementContext);
    }
    public SEMICOLON(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.SEMICOLON, 0)!;
    }
    public ARROW(): antlr.TerminalNode[];
    public ARROW(i: number): antlr.TerminalNode | null;
    public ARROW(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(ESPACEParser.ARROW);
    	} else {
    		return this.getToken(ESPACEParser.ARROW, i);
    	}
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_simpleTransition;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterSimpleTransition) {
             listener.enterSimpleTransition(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitSimpleTransition) {
             listener.exitSimpleTransition(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitSimpleTransition) {
            return visitor.visitSimpleTransition(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ConditionalTransitionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public conditionalTransitionHeader(): ConditionalTransitionHeaderContext {
        return this.getRuleContext(0, ConditionalTransitionHeaderContext)!;
    }
    public conditionalTransitionBody(): ConditionalTransitionBodyContext {
        return this.getRuleContext(0, ConditionalTransitionBodyContext)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_conditionalTransition;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterConditionalTransition) {
             listener.enterConditionalTransition(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitConditionalTransition) {
             listener.exitConditionalTransition(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitConditionalTransition) {
            return visitor.visitConditionalTransition(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ConditionalTransitionHeaderContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public controlChainElement(): ControlChainElementContext[];
    public controlChainElement(i: number): ControlChainElementContext | null;
    public controlChainElement(i?: number): ControlChainElementContext[] | ControlChainElementContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ControlChainElementContext);
        }

        return this.getRuleContext(i, ControlChainElementContext);
    }
    public CONDITION_ARROW(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.CONDITION_ARROW, 0)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_conditionalTransitionHeader;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterConditionalTransitionHeader) {
             listener.enterConditionalTransitionHeader(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitConditionalTransitionHeader) {
             listener.exitConditionalTransitionHeader(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitConditionalTransitionHeader) {
            return visitor.visitConditionalTransitionHeader(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ConditionalTransitionBodyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LBRACE(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.LBRACE, 0)!;
    }
    public RBRACE(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.RBRACE, 0)!;
    }
    public condition(): ConditionContext[];
    public condition(i: number): ConditionContext | null;
    public condition(i?: number): ConditionContext[] | ConditionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ConditionContext);
        }

        return this.getRuleContext(i, ConditionContext);
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_conditionalTransitionBody;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterConditionalTransitionBody) {
             listener.enterConditionalTransitionBody(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitConditionalTransitionBody) {
             listener.exitConditionalTransitionBody(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitConditionalTransitionBody) {
            return visitor.visitConditionalTransitionBody(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ConditionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public CONDITION(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.CONDITION, 0)!;
    }
    public STRING(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.STRING, 0)!;
    }
    public SEMICOLON(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.SEMICOLON, 0)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_condition;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterCondition) {
             listener.enterCondition(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitCondition) {
             listener.exitCondition(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitCondition) {
            return visitor.visitCondition(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ControlChainElementContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public START(): antlr.TerminalNode | null {
        return this.getToken(ESPACEParser.START, 0);
    }
    public END(): antlr.TerminalNode | null {
        return this.getToken(ESPACEParser.END, 0);
    }
    public spaceNameRead(): SpaceNameReadContext | null {
        return this.getRuleContext(0, SpaceNameReadContext);
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_controlChainElement;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterControlChainElement) {
             listener.enterControlChainElement(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitControlChainElement) {
             listener.exitControlChainElement(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitControlChainElement) {
            return visitor.visitControlChainElement(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class DataDefinitionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DEFINE(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.DEFINE, 0)!;
    }
    public DATA(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.DATA, 0)!;
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.IDENTIFIER, 0)!;
    }
    public EQUALS(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.EQUALS, 0)!;
    }
    public STRING(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.STRING, 0)!;
    }
    public SEMICOLON(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.SEMICOLON, 0)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_dataDefinition;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterDataDefinition) {
             listener.enterDataDefinition(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitDataDefinition) {
             listener.exitDataDefinition(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitDataDefinition) {
            return visitor.visitDataDefinition(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class WorkflowNameReadContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.IDENTIFIER, 0)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_workflowNameRead;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterWorkflowNameRead) {
             listener.enterWorkflowNameRead(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitWorkflowNameRead) {
             listener.exitWorkflowNameRead(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitWorkflowNameRead) {
            return visitor.visitWorkflowNameRead(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TaskNameReadContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.IDENTIFIER, 0)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_taskNameRead;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterTaskNameRead) {
             listener.enterTaskNameRead(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitTaskNameRead) {
             listener.exitTaskNameRead(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitTaskNameRead) {
            return visitor.visitTaskNameRead(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SpaceNameReadContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(ESPACEParser.IDENTIFIER, 0)!;
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_spaceNameRead;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterSpaceNameRead) {
             listener.enterSpaceNameRead(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitSpaceNameRead) {
             listener.exitSpaceNameRead(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitSpaceNameRead) {
            return visitor.visitSpaceNameRead(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NUMBER(): antlr.TerminalNode | null {
        return this.getToken(ESPACEParser.NUMBER, 0);
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(ESPACEParser.STRING, 0);
    }
    public BOOLEAN(): antlr.TerminalNode | null {
        return this.getToken(ESPACEParser.BOOLEAN, 0);
    }
    public override get ruleIndex(): number {
        return ESPACEParser.RULE_expression;
    }
    public override enterRule(listener: ESPACEListener): void {
        if(listener.enterExpression) {
             listener.enterExpression(this);
        }
    }
    public override exitRule(listener: ESPACEListener): void {
        if(listener.exitExpression) {
             listener.exitExpression(this);
        }
    }
    public override accept<Result>(visitor: ESPACEVisitor<Result>): Result | null {
        if (visitor.visitExpression) {
            return visitor.visitExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
