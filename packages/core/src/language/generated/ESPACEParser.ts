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
    public static readonly IDENTIFIER = 23;
    public static readonly STRING = 24;
    public static readonly NUMBER = 25;
    public static readonly WS = 26;
    public static readonly COMMENT = 27;
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
    public static readonly RULE_dataDefinition = 27;
    public static readonly RULE_workflowNameRead = 28;
    public static readonly RULE_taskNameRead = 29;
    public static readonly RULE_spaceNameRead = 30;
    public static readonly RULE_expression = 31;

    public static readonly literalNames = [
        null, "';'", "'->'", "'-?>'", "'{'", "'}'", "'('", "')'", "'='", 
        "','", "'experiment'", "'space'", "'of'", "'strategy'", "'param'", 
        "'enum'", "'range'", "'configure'", "'task'", "'control'", "'condition'", 
        "'define'", "'data'"
    ];

    public static readonly symbolicNames = [
        null, "SEMICOLON", "ARROW", "CONDITION_ARROW", "LBRACE", "RBRACE", 
        "LPAREN", "RPAREN", "EQUALS", "COMMA", "EXPERIMENT", "SPACE", "OF", 
        "STRATEGY", "PARAM", "ENUM", "RANGE", "CONFIGURE", "TASK", "CONTROL", 
        "CONDITION", "DEFINE", "DATA", "IDENTIFIER", "STRING", "NUMBER", 
        "WS", "COMMENT"
    ];
    public static readonly ruleNames = [
        "program", "experimentDeclaration", "experimentHeader", "experimentBody", 
        "experimentContent", "spaceDeclaration", "spaceHeader", "spaceBody", 
        "spaceContent", "strategyStatement", "paramDefinition", "paramValue", 
        "enumFunction", "rangeFunction", "taskConfiguration", "taskConfigurationHeader", 
        "taskConfigurationBody", "configurationContent", "paramAssignment", 
        "controlBlock", "controlBody", "controlContent", "simpleTransition", 
        "conditionalTransition", "conditionalTransitionHeader", "conditionalTransitionBody", 
        "condition", "dataDefinition", "workflowNameRead", "taskNameRead", 
        "spaceNameRead", "expression",
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
            this.state = 64;
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
            this.state = 66;
            this.experimentHeader();
            this.state = 67;
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
            this.state = 69;
            this.match(ESPACEParser.EXPERIMENT);
            this.state = 70;
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
            this.state = 72;
            this.match(ESPACEParser.LBRACE);
            this.state = 76;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 2623488) !== 0)) {
                {
                {
                this.state = 73;
                this.experimentContent();
                }
                }
                this.state = 78;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 79;
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
            this.state = 84;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case ESPACEParser.SPACE:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 81;
                this.spaceDeclaration();
                }
                break;
            case ESPACEParser.CONTROL:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 82;
                this.controlBlock();
                }
                break;
            case ESPACEParser.DEFINE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 83;
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
            this.state = 86;
            this.spaceHeader();
            this.state = 87;
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
            this.state = 89;
            this.match(ESPACEParser.SPACE);
            this.state = 90;
            this.match(ESPACEParser.IDENTIFIER);
            this.state = 91;
            this.match(ESPACEParser.OF);
            this.state = 92;
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
            this.state = 94;
            this.match(ESPACEParser.LBRACE);
            this.state = 98;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 155648) !== 0)) {
                {
                {
                this.state = 95;
                this.spaceContent();
                }
                }
                this.state = 100;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 101;
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
            this.state = 106;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case ESPACEParser.STRATEGY:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 103;
                this.strategyStatement();
                }
                break;
            case ESPACEParser.PARAM:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 104;
                this.paramDefinition();
                }
                break;
            case ESPACEParser.CONFIGURE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 105;
                this.taskConfiguration();
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
            this.state = 108;
            this.match(ESPACEParser.STRATEGY);
            this.state = 109;
            this.match(ESPACEParser.IDENTIFIER);
            this.state = 110;
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
            this.state = 112;
            this.match(ESPACEParser.PARAM);
            this.state = 113;
            this.match(ESPACEParser.IDENTIFIER);
            this.state = 114;
            this.match(ESPACEParser.EQUALS);
            this.state = 115;
            this.paramValue();
            this.state = 116;
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
            this.state = 120;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case ESPACEParser.ENUM:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 118;
                this.enumFunction();
                }
                break;
            case ESPACEParser.RANGE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 119;
                this.rangeFunction();
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
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 122;
            this.match(ESPACEParser.ENUM);
            this.state = 123;
            this.match(ESPACEParser.LPAREN);
            this.state = 124;
            this.expression();
            this.state = 125;
            this.match(ESPACEParser.COMMA);
            this.state = 126;
            this.expression();
            this.state = 127;
            this.match(ESPACEParser.COMMA);
            this.state = 128;
            this.expression();
            this.state = 129;
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
            this.state = 131;
            this.match(ESPACEParser.RANGE);
            this.state = 132;
            this.match(ESPACEParser.LPAREN);
            this.state = 133;
            this.match(ESPACEParser.NUMBER);
            this.state = 134;
            this.match(ESPACEParser.COMMA);
            this.state = 135;
            this.match(ESPACEParser.NUMBER);
            this.state = 136;
            this.match(ESPACEParser.COMMA);
            this.state = 137;
            this.match(ESPACEParser.NUMBER);
            this.state = 138;
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
            this.state = 140;
            this.taskConfigurationHeader();
            this.state = 141;
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
            this.state = 143;
            this.match(ESPACEParser.CONFIGURE);
            this.state = 144;
            this.match(ESPACEParser.TASK);
            this.state = 145;
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
            this.state = 147;
            this.match(ESPACEParser.LBRACE);
            this.state = 151;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 14) {
                {
                {
                this.state = 148;
                this.configurationContent();
                }
                }
                this.state = 153;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 154;
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
            this.state = 156;
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
            this.state = 158;
            this.match(ESPACEParser.PARAM);
            this.state = 159;
            this.match(ESPACEParser.IDENTIFIER);
            this.state = 160;
            this.match(ESPACEParser.EQUALS);
            this.state = 161;
            this.expression();
            this.state = 162;
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
            this.state = 164;
            this.match(ESPACEParser.CONTROL);
            this.state = 165;
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
            this.state = 167;
            this.match(ESPACEParser.LBRACE);
            this.state = 171;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 23) {
                {
                {
                this.state = 168;
                this.controlContent();
                }
                }
                this.state = 173;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 174;
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
            this.state = 178;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 7, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 176;
                this.simpleTransition();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 177;
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
            this.state = 180;
            this.spaceNameRead();
            this.state = 183;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 181;
                this.match(ESPACEParser.ARROW);
                this.state = 182;
                this.spaceNameRead();
                }
                }
                this.state = 185;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while (_la === 2);
            this.state = 187;
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
            this.state = 189;
            this.conditionalTransitionHeader();
            this.state = 190;
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
            this.state = 192;
            this.spaceNameRead();
            this.state = 193;
            this.match(ESPACEParser.CONDITION_ARROW);
            this.state = 194;
            this.spaceNameRead();
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
            this.state = 196;
            this.match(ESPACEParser.LBRACE);
            this.state = 200;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 20) {
                {
                {
                this.state = 197;
                this.condition();
                }
                }
                this.state = 202;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 203;
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
            this.state = 205;
            this.match(ESPACEParser.CONDITION);
            this.state = 206;
            this.match(ESPACEParser.STRING);
            this.state = 207;
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
    public dataDefinition(): DataDefinitionContext {
        let localContext = new DataDefinitionContext(this.context, this.state);
        this.enterRule(localContext, 54, ESPACEParser.RULE_dataDefinition);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 209;
            this.match(ESPACEParser.DEFINE);
            this.state = 210;
            this.match(ESPACEParser.DATA);
            this.state = 211;
            this.match(ESPACEParser.IDENTIFIER);
            this.state = 212;
            this.match(ESPACEParser.EQUALS);
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
    public workflowNameRead(): WorkflowNameReadContext {
        let localContext = new WorkflowNameReadContext(this.context, this.state);
        this.enterRule(localContext, 56, ESPACEParser.RULE_workflowNameRead);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 216;
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
        this.enterRule(localContext, 58, ESPACEParser.RULE_taskNameRead);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 218;
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
        this.enterRule(localContext, 60, ESPACEParser.RULE_spaceNameRead);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 220;
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
        this.enterRule(localContext, 62, ESPACEParser.RULE_expression);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 222;
            _la = this.tokenStream.LA(1);
            if(!(_la === 24 || _la === 25)) {
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
        4,1,27,225,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,20,
        7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,26,
        2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,1,0,1,0,1,1,1,
        1,1,1,1,2,1,2,1,2,1,3,1,3,5,3,75,8,3,10,3,12,3,78,9,3,1,3,1,3,1,
        4,1,4,1,4,3,4,85,8,4,1,5,1,5,1,5,1,6,1,6,1,6,1,6,1,6,1,7,1,7,5,7,
        97,8,7,10,7,12,7,100,9,7,1,7,1,7,1,8,1,8,1,8,3,8,107,8,8,1,9,1,9,
        1,9,1,9,1,10,1,10,1,10,1,10,1,10,1,10,1,11,1,11,3,11,121,8,11,1,
        12,1,12,1,12,1,12,1,12,1,12,1,12,1,12,1,12,1,13,1,13,1,13,1,13,1,
        13,1,13,1,13,1,13,1,13,1,14,1,14,1,14,1,15,1,15,1,15,1,15,1,16,1,
        16,5,16,150,8,16,10,16,12,16,153,9,16,1,16,1,16,1,17,1,17,1,18,1,
        18,1,18,1,18,1,18,1,18,1,19,1,19,1,19,1,20,1,20,5,20,170,8,20,10,
        20,12,20,173,9,20,1,20,1,20,1,21,1,21,3,21,179,8,21,1,22,1,22,1,
        22,4,22,184,8,22,11,22,12,22,185,1,22,1,22,1,23,1,23,1,23,1,24,1,
        24,1,24,1,24,1,25,1,25,5,25,199,8,25,10,25,12,25,202,9,25,1,25,1,
        25,1,26,1,26,1,26,1,26,1,27,1,27,1,27,1,27,1,27,1,27,1,27,1,28,1,
        28,1,29,1,29,1,30,1,30,1,31,1,31,1,31,0,0,32,0,2,4,6,8,10,12,14,
        16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,
        60,62,0,1,1,0,24,25,204,0,64,1,0,0,0,2,66,1,0,0,0,4,69,1,0,0,0,6,
        72,1,0,0,0,8,84,1,0,0,0,10,86,1,0,0,0,12,89,1,0,0,0,14,94,1,0,0,
        0,16,106,1,0,0,0,18,108,1,0,0,0,20,112,1,0,0,0,22,120,1,0,0,0,24,
        122,1,0,0,0,26,131,1,0,0,0,28,140,1,0,0,0,30,143,1,0,0,0,32,147,
        1,0,0,0,34,156,1,0,0,0,36,158,1,0,0,0,38,164,1,0,0,0,40,167,1,0,
        0,0,42,178,1,0,0,0,44,180,1,0,0,0,46,189,1,0,0,0,48,192,1,0,0,0,
        50,196,1,0,0,0,52,205,1,0,0,0,54,209,1,0,0,0,56,216,1,0,0,0,58,218,
        1,0,0,0,60,220,1,0,0,0,62,222,1,0,0,0,64,65,3,2,1,0,65,1,1,0,0,0,
        66,67,3,4,2,0,67,68,3,6,3,0,68,3,1,0,0,0,69,70,5,10,0,0,70,71,5,
        23,0,0,71,5,1,0,0,0,72,76,5,4,0,0,73,75,3,8,4,0,74,73,1,0,0,0,75,
        78,1,0,0,0,76,74,1,0,0,0,76,77,1,0,0,0,77,79,1,0,0,0,78,76,1,0,0,
        0,79,80,5,5,0,0,80,7,1,0,0,0,81,85,3,10,5,0,82,85,3,38,19,0,83,85,
        3,54,27,0,84,81,1,0,0,0,84,82,1,0,0,0,84,83,1,0,0,0,85,9,1,0,0,0,
        86,87,3,12,6,0,87,88,3,14,7,0,88,11,1,0,0,0,89,90,5,11,0,0,90,91,
        5,23,0,0,91,92,5,12,0,0,92,93,3,56,28,0,93,13,1,0,0,0,94,98,5,4,
        0,0,95,97,3,16,8,0,96,95,1,0,0,0,97,100,1,0,0,0,98,96,1,0,0,0,98,
        99,1,0,0,0,99,101,1,0,0,0,100,98,1,0,0,0,101,102,5,5,0,0,102,15,
        1,0,0,0,103,107,3,18,9,0,104,107,3,20,10,0,105,107,3,28,14,0,106,
        103,1,0,0,0,106,104,1,0,0,0,106,105,1,0,0,0,107,17,1,0,0,0,108,109,
        5,13,0,0,109,110,5,23,0,0,110,111,5,1,0,0,111,19,1,0,0,0,112,113,
        5,14,0,0,113,114,5,23,0,0,114,115,5,8,0,0,115,116,3,22,11,0,116,
        117,5,1,0,0,117,21,1,0,0,0,118,121,3,24,12,0,119,121,3,26,13,0,120,
        118,1,0,0,0,120,119,1,0,0,0,121,23,1,0,0,0,122,123,5,15,0,0,123,
        124,5,6,0,0,124,125,3,62,31,0,125,126,5,9,0,0,126,127,3,62,31,0,
        127,128,5,9,0,0,128,129,3,62,31,0,129,130,5,7,0,0,130,25,1,0,0,0,
        131,132,5,16,0,0,132,133,5,6,0,0,133,134,5,25,0,0,134,135,5,9,0,
        0,135,136,5,25,0,0,136,137,5,9,0,0,137,138,5,25,0,0,138,139,5,7,
        0,0,139,27,1,0,0,0,140,141,3,30,15,0,141,142,3,32,16,0,142,29,1,
        0,0,0,143,144,5,17,0,0,144,145,5,18,0,0,145,146,3,58,29,0,146,31,
        1,0,0,0,147,151,5,4,0,0,148,150,3,34,17,0,149,148,1,0,0,0,150,153,
        1,0,0,0,151,149,1,0,0,0,151,152,1,0,0,0,152,154,1,0,0,0,153,151,
        1,0,0,0,154,155,5,5,0,0,155,33,1,0,0,0,156,157,3,36,18,0,157,35,
        1,0,0,0,158,159,5,14,0,0,159,160,5,23,0,0,160,161,5,8,0,0,161,162,
        3,62,31,0,162,163,5,1,0,0,163,37,1,0,0,0,164,165,5,19,0,0,165,166,
        3,40,20,0,166,39,1,0,0,0,167,171,5,4,0,0,168,170,3,42,21,0,169,168,
        1,0,0,0,170,173,1,0,0,0,171,169,1,0,0,0,171,172,1,0,0,0,172,174,
        1,0,0,0,173,171,1,0,0,0,174,175,5,5,0,0,175,41,1,0,0,0,176,179,3,
        44,22,0,177,179,3,46,23,0,178,176,1,0,0,0,178,177,1,0,0,0,179,43,
        1,0,0,0,180,183,3,60,30,0,181,182,5,2,0,0,182,184,3,60,30,0,183,
        181,1,0,0,0,184,185,1,0,0,0,185,183,1,0,0,0,185,186,1,0,0,0,186,
        187,1,0,0,0,187,188,5,1,0,0,188,45,1,0,0,0,189,190,3,48,24,0,190,
        191,3,50,25,0,191,47,1,0,0,0,192,193,3,60,30,0,193,194,5,3,0,0,194,
        195,3,60,30,0,195,49,1,0,0,0,196,200,5,4,0,0,197,199,3,52,26,0,198,
        197,1,0,0,0,199,202,1,0,0,0,200,198,1,0,0,0,200,201,1,0,0,0,201,
        203,1,0,0,0,202,200,1,0,0,0,203,204,5,5,0,0,204,51,1,0,0,0,205,206,
        5,20,0,0,206,207,5,24,0,0,207,208,5,1,0,0,208,53,1,0,0,0,209,210,
        5,21,0,0,210,211,5,22,0,0,211,212,5,23,0,0,212,213,5,8,0,0,213,214,
        5,24,0,0,214,215,5,1,0,0,215,55,1,0,0,0,216,217,5,23,0,0,217,57,
        1,0,0,0,218,219,5,23,0,0,219,59,1,0,0,0,220,221,5,23,0,0,221,61,
        1,0,0,0,222,223,7,0,0,0,223,63,1,0,0,0,10,76,84,98,106,120,151,171,
        178,185,200
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
    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext)!;
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
    public spaceNameRead(): SpaceNameReadContext[];
    public spaceNameRead(i: number): SpaceNameReadContext | null;
    public spaceNameRead(i?: number): SpaceNameReadContext[] | SpaceNameReadContext | null {
        if (i === undefined) {
            return this.getRuleContexts(SpaceNameReadContext);
        }

        return this.getRuleContext(i, SpaceNameReadContext);
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
    public spaceNameRead(): SpaceNameReadContext[];
    public spaceNameRead(i: number): SpaceNameReadContext | null;
    public spaceNameRead(i?: number): SpaceNameReadContext[] | SpaceNameReadContext | null {
        if (i === undefined) {
            return this.getRuleContexts(SpaceNameReadContext);
        }

        return this.getRuleContext(i, SpaceNameReadContext);
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
