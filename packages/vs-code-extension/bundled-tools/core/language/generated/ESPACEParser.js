import * as antlr from "antlr4ng";
export class ESPACEParser extends antlr.Parser {
    static SEMICOLON = 1;
    static ARROW = 2;
    static CONDITION_ARROW = 3;
    static LBRACE = 4;
    static RBRACE = 5;
    static LPAREN = 6;
    static RPAREN = 7;
    static EQUALS = 8;
    static COMMA = 9;
    static EXPERIMENT = 10;
    static SPACE = 11;
    static OF = 12;
    static STRATEGY = 13;
    static PARAM = 14;
    static ENUM = 15;
    static RANGE = 16;
    static CONFIGURE = 17;
    static TASK = 18;
    static CONTROL = 19;
    static CONDITION = 20;
    static DEFINE = 21;
    static DATA = 22;
    static START = 23;
    static END = 24;
    static BOOLEAN = 25;
    static IDENTIFIER = 26;
    static STRING = 27;
    static NUMBER = 28;
    static WS = 29;
    static COMMENT = 30;
    static RULE_program = 0;
    static RULE_experimentDeclaration = 1;
    static RULE_experimentHeader = 2;
    static RULE_experimentBody = 3;
    static RULE_experimentContent = 4;
    static RULE_spaceDeclaration = 5;
    static RULE_spaceHeader = 6;
    static RULE_spaceBody = 7;
    static RULE_spaceContent = 8;
    static RULE_strategyStatement = 9;
    static RULE_paramDefinition = 10;
    static RULE_paramValue = 11;
    static RULE_enumFunction = 12;
    static RULE_rangeFunction = 13;
    static RULE_taskConfiguration = 14;
    static RULE_taskConfigurationHeader = 15;
    static RULE_taskConfigurationBody = 16;
    static RULE_configurationContent = 17;
    static RULE_paramAssignment = 18;
    static RULE_controlBlock = 19;
    static RULE_controlBody = 20;
    static RULE_controlContent = 21;
    static RULE_simpleTransition = 22;
    static RULE_conditionalTransition = 23;
    static RULE_conditionalTransitionHeader = 24;
    static RULE_conditionalTransitionBody = 25;
    static RULE_condition = 26;
    static RULE_controlChainElement = 27;
    static RULE_dataDefinition = 28;
    static RULE_workflowNameRead = 29;
    static RULE_taskNameRead = 30;
    static RULE_spaceNameRead = 31;
    static RULE_expression = 32;
    static literalNames = [
        null, "';'", "'->'", "'-?>'", "'{'", "'}'", "'('", "')'", "'='",
        "','", "'experiment'", "'space'", "'of'", "'strategy'", "'param'",
        "'enum'", "'range'", "'configure'", "'task'", "'control'", "'condition'",
        "'define'", "'data'", "'start'", "'end'"
    ];
    static symbolicNames = [
        null, "SEMICOLON", "ARROW", "CONDITION_ARROW", "LBRACE", "RBRACE",
        "LPAREN", "RPAREN", "EQUALS", "COMMA", "EXPERIMENT", "SPACE", "OF",
        "STRATEGY", "PARAM", "ENUM", "RANGE", "CONFIGURE", "TASK", "CONTROL",
        "CONDITION", "DEFINE", "DATA", "START", "END", "BOOLEAN", "IDENTIFIER",
        "STRING", "NUMBER", "WS", "COMMENT"
    ];
    static ruleNames = [
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
    get grammarFileName() { return "ESPACE.g4"; }
    get literalNames() { return ESPACEParser.literalNames; }
    get symbolicNames() { return ESPACEParser.symbolicNames; }
    get ruleNames() { return ESPACEParser.ruleNames; }
    get serializedATN() { return ESPACEParser._serializedATN; }
    createFailedPredicateException(predicate, message) {
        return new antlr.FailedPredicateException(this, predicate, message);
    }
    constructor(input) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, ESPACEParser._ATN, ESPACEParser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    program() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    experimentDeclaration() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    experimentHeader() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    experimentBody() {
        let localContext = new ExperimentBodyContext(this.context, this.state);
        this.enterRule(localContext, 6, ESPACEParser.RULE_experimentBody);
        let _la;
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    experimentContent() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    spaceDeclaration() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    spaceHeader() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    spaceBody() {
        let localContext = new SpaceBodyContext(this.context, this.state);
        this.enterRule(localContext, 14, ESPACEParser.RULE_spaceBody);
        let _la;
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    spaceContent() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    strategyStatement() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    paramDefinition() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    paramValue() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    enumFunction() {
        let localContext = new EnumFunctionContext(this.context, this.state);
        this.enterRule(localContext, 24, ESPACEParser.RULE_enumFunction);
        let _la;
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    rangeFunction() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    taskConfiguration() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    taskConfigurationHeader() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    taskConfigurationBody() {
        let localContext = new TaskConfigurationBodyContext(this.context, this.state);
        this.enterRule(localContext, 32, ESPACEParser.RULE_taskConfigurationBody);
        let _la;
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    configurationContent() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    paramAssignment() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    controlBlock() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    controlBody() {
        let localContext = new ControlBodyContext(this.context, this.state);
        this.enterRule(localContext, 40, ESPACEParser.RULE_controlBody);
        let _la;
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    controlContent() {
        let localContext = new ControlContentContext(this.context, this.state);
        this.enterRule(localContext, 42, ESPACEParser.RULE_controlContent);
        try {
            this.state = 185;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 8, this.context)) {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    simpleTransition() {
        let localContext = new SimpleTransitionContext(this.context, this.state);
        this.enterRule(localContext, 44, ESPACEParser.RULE_simpleTransition);
        let _la;
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    conditionalTransition() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    conditionalTransitionHeader() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    conditionalTransitionBody() {
        let localContext = new ConditionalTransitionBodyContext(this.context, this.state);
        this.enterRule(localContext, 50, ESPACEParser.RULE_conditionalTransitionBody);
        let _la;
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    condition() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    controlChainElement() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    dataDefinition() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    workflowNameRead() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    taskNameRead() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    spaceNameRead() {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    expression() {
        let localContext = new ExpressionContext(this.context, this.state);
        this.enterRule(localContext, 64, ESPACEParser.RULE_expression);
        let _la;
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 234;
                _la = this.tokenStream.LA(1);
                if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & 436207616) !== 0))) {
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
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    static _serializedATN = [
        4, 1, 30, 237, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 2, 6, 7,
        6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2, 10, 7, 10, 2, 11, 7, 11, 2, 12, 7, 12, 2, 13, 7, 13,
        2, 14, 7, 14, 2, 15, 7, 15, 2, 16, 7, 16, 2, 17, 7, 17, 2, 18, 7, 18, 2, 19, 7, 19, 2, 20,
        7, 20, 2, 21, 7, 21, 2, 22, 7, 22, 2, 23, 7, 23, 2, 24, 7, 24, 2, 25, 7, 25, 2, 26, 7, 26,
        2, 27, 7, 27, 2, 28, 7, 28, 2, 29, 7, 29, 2, 30, 7, 30, 2, 31, 7, 31, 2, 32, 7, 32, 1, 0,
        1, 0, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 3, 1, 3, 5, 3, 77, 8, 3, 10, 3, 12, 3, 80, 9, 3,
        1, 3, 1, 3, 1, 4, 1, 4, 1, 4, 3, 4, 87, 8, 4, 1, 5, 1, 5, 1, 5, 1, 6, 1, 6, 1, 6, 1, 6, 1, 6, 1,
        7, 1, 7, 5, 7, 99, 8, 7, 10, 7, 12, 7, 102, 9, 7, 1, 7, 1, 7, 1, 8, 1, 8, 1, 8, 1, 8, 3, 8, 110,
        8, 8, 1, 9, 1, 9, 1, 9, 1, 9, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 11, 1, 11, 1, 11,
        3, 11, 125, 8, 11, 1, 12, 1, 12, 1, 12, 1, 12, 1, 12, 5, 12, 132, 8, 12, 10, 12, 12, 12,
        135, 9, 12, 1, 12, 1, 12, 1, 13, 1, 13, 1, 13, 1, 13, 1, 13, 1, 13, 1, 13, 1, 13, 1, 13,
        1, 14, 1, 14, 1, 14, 1, 15, 1, 15, 1, 15, 1, 15, 1, 16, 1, 16, 5, 16, 157, 8, 16, 10, 16,
        12, 16, 160, 9, 16, 1, 16, 1, 16, 1, 17, 1, 17, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18, 1, 18,
        1, 19, 1, 19, 1, 19, 1, 20, 1, 20, 5, 20, 177, 8, 20, 10, 20, 12, 20, 180, 9, 20, 1, 20,
        1, 20, 1, 21, 1, 21, 3, 21, 186, 8, 21, 1, 22, 1, 22, 1, 22, 4, 22, 191, 8, 22, 11, 22,
        12, 22, 192, 1, 22, 1, 22, 1, 23, 1, 23, 1, 23, 1, 24, 1, 24, 1, 24, 1, 24, 1, 25, 1, 25,
        5, 25, 206, 8, 25, 10, 25, 12, 25, 209, 9, 25, 1, 25, 1, 25, 1, 26, 1, 26, 1, 26, 1, 26,
        1, 27, 1, 27, 1, 27, 3, 27, 220, 8, 27, 1, 28, 1, 28, 1, 28, 1, 28, 1, 28, 1, 28, 1, 28,
        1, 29, 1, 29, 1, 30, 1, 30, 1, 31, 1, 31, 1, 32, 1, 32, 1, 32, 0, 0, 33, 0, 2, 4, 6, 8, 10,
        12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54,
        56, 58, 60, 62, 64, 0, 1, 2, 0, 25, 25, 27, 28, 220, 0, 66, 1, 0, 0, 0, 2, 68, 1, 0, 0, 0,
        4, 71, 1, 0, 0, 0, 6, 74, 1, 0, 0, 0, 8, 86, 1, 0, 0, 0, 10, 88, 1, 0, 0, 0, 12, 91, 1, 0, 0,
        0, 14, 96, 1, 0, 0, 0, 16, 109, 1, 0, 0, 0, 18, 111, 1, 0, 0, 0, 20, 115, 1, 0, 0, 0, 22,
        124, 1, 0, 0, 0, 24, 126, 1, 0, 0, 0, 26, 138, 1, 0, 0, 0, 28, 147, 1, 0, 0, 0, 30, 150,
        1, 0, 0, 0, 32, 154, 1, 0, 0, 0, 34, 163, 1, 0, 0, 0, 36, 165, 1, 0, 0, 0, 38, 171, 1, 0,
        0, 0, 40, 174, 1, 0, 0, 0, 42, 185, 1, 0, 0, 0, 44, 187, 1, 0, 0, 0, 46, 196, 1, 0, 0, 0,
        48, 199, 1, 0, 0, 0, 50, 203, 1, 0, 0, 0, 52, 212, 1, 0, 0, 0, 54, 219, 1, 0, 0, 0, 56, 221,
        1, 0, 0, 0, 58, 228, 1, 0, 0, 0, 60, 230, 1, 0, 0, 0, 62, 232, 1, 0, 0, 0, 64, 234, 1, 0,
        0, 0, 66, 67, 3, 2, 1, 0, 67, 1, 1, 0, 0, 0, 68, 69, 3, 4, 2, 0, 69, 70, 3, 6, 3, 0, 70, 3,
        1, 0, 0, 0, 71, 72, 5, 10, 0, 0, 72, 73, 5, 26, 0, 0, 73, 5, 1, 0, 0, 0, 74, 78, 5, 4, 0, 0,
        75, 77, 3, 8, 4, 0, 76, 75, 1, 0, 0, 0, 77, 80, 1, 0, 0, 0, 78, 76, 1, 0, 0, 0, 78, 79, 1,
        0, 0, 0, 79, 81, 1, 0, 0, 0, 80, 78, 1, 0, 0, 0, 81, 82, 5, 5, 0, 0, 82, 7, 1, 0, 0, 0, 83,
        87, 3, 10, 5, 0, 84, 87, 3, 38, 19, 0, 85, 87, 3, 56, 28, 0, 86, 83, 1, 0, 0, 0, 86, 84,
        1, 0, 0, 0, 86, 85, 1, 0, 0, 0, 87, 9, 1, 0, 0, 0, 88, 89, 3, 12, 6, 0, 89, 90, 3, 14, 7, 0,
        90, 11, 1, 0, 0, 0, 91, 92, 5, 11, 0, 0, 92, 93, 5, 26, 0, 0, 93, 94, 5, 12, 0, 0, 94, 95,
        3, 58, 29, 0, 95, 13, 1, 0, 0, 0, 96, 100, 5, 4, 0, 0, 97, 99, 3, 16, 8, 0, 98, 97, 1, 0,
        0, 0, 99, 102, 1, 0, 0, 0, 100, 98, 1, 0, 0, 0, 100, 101, 1, 0, 0, 0, 101, 103, 1, 0, 0,
        0, 102, 100, 1, 0, 0, 0, 103, 104, 5, 5, 0, 0, 104, 15, 1, 0, 0, 0, 105, 110, 3, 18, 9,
        0, 106, 110, 3, 20, 10, 0, 107, 110, 3, 28, 14, 0, 108, 110, 3, 56, 28, 0, 109, 105,
        1, 0, 0, 0, 109, 106, 1, 0, 0, 0, 109, 107, 1, 0, 0, 0, 109, 108, 1, 0, 0, 0, 110, 17, 1,
        0, 0, 0, 111, 112, 5, 13, 0, 0, 112, 113, 5, 26, 0, 0, 113, 114, 5, 1, 0, 0, 114, 19, 1,
        0, 0, 0, 115, 116, 5, 14, 0, 0, 116, 117, 5, 26, 0, 0, 117, 118, 5, 8, 0, 0, 118, 119,
        3, 22, 11, 0, 119, 120, 5, 1, 0, 0, 120, 21, 1, 0, 0, 0, 121, 125, 3, 24, 12, 0, 122, 125,
        3, 26, 13, 0, 123, 125, 3, 64, 32, 0, 124, 121, 1, 0, 0, 0, 124, 122, 1, 0, 0, 0, 124,
        123, 1, 0, 0, 0, 125, 23, 1, 0, 0, 0, 126, 127, 5, 15, 0, 0, 127, 128, 5, 6, 0, 0, 128,
        133, 3, 64, 32, 0, 129, 130, 5, 9, 0, 0, 130, 132, 3, 64, 32, 0, 131, 129, 1, 0, 0, 0,
        132, 135, 1, 0, 0, 0, 133, 131, 1, 0, 0, 0, 133, 134, 1, 0, 0, 0, 134, 136, 1, 0, 0, 0,
        135, 133, 1, 0, 0, 0, 136, 137, 5, 7, 0, 0, 137, 25, 1, 0, 0, 0, 138, 139, 5, 16, 0, 0,
        139, 140, 5, 6, 0, 0, 140, 141, 5, 28, 0, 0, 141, 142, 5, 9, 0, 0, 142, 143, 5, 28, 0,
        0, 143, 144, 5, 9, 0, 0, 144, 145, 5, 28, 0, 0, 145, 146, 5, 7, 0, 0, 146, 27, 1, 0, 0,
        0, 147, 148, 3, 30, 15, 0, 148, 149, 3, 32, 16, 0, 149, 29, 1, 0, 0, 0, 150, 151, 5, 17,
        0, 0, 151, 152, 5, 18, 0, 0, 152, 153, 3, 60, 30, 0, 153, 31, 1, 0, 0, 0, 154, 158, 5,
        4, 0, 0, 155, 157, 3, 34, 17, 0, 156, 155, 1, 0, 0, 0, 157, 160, 1, 0, 0, 0, 158, 156,
        1, 0, 0, 0, 158, 159, 1, 0, 0, 0, 159, 161, 1, 0, 0, 0, 160, 158, 1, 0, 0, 0, 161, 162,
        5, 5, 0, 0, 162, 33, 1, 0, 0, 0, 163, 164, 3, 36, 18, 0, 164, 35, 1, 0, 0, 0, 165, 166,
        5, 14, 0, 0, 166, 167, 5, 26, 0, 0, 167, 168, 5, 8, 0, 0, 168, 169, 3, 22, 11, 0, 169,
        170, 5, 1, 0, 0, 170, 37, 1, 0, 0, 0, 171, 172, 5, 19, 0, 0, 172, 173, 3, 40, 20, 0, 173,
        39, 1, 0, 0, 0, 174, 178, 5, 4, 0, 0, 175, 177, 3, 42, 21, 0, 176, 175, 1, 0, 0, 0, 177,
        180, 1, 0, 0, 0, 178, 176, 1, 0, 0, 0, 178, 179, 1, 0, 0, 0, 179, 181, 1, 0, 0, 0, 180,
        178, 1, 0, 0, 0, 181, 182, 5, 5, 0, 0, 182, 41, 1, 0, 0, 0, 183, 186, 3, 44, 22, 0, 184,
        186, 3, 46, 23, 0, 185, 183, 1, 0, 0, 0, 185, 184, 1, 0, 0, 0, 186, 43, 1, 0, 0, 0, 187,
        190, 3, 54, 27, 0, 188, 189, 5, 2, 0, 0, 189, 191, 3, 54, 27, 0, 190, 188, 1, 0, 0, 0,
        191, 192, 1, 0, 0, 0, 192, 190, 1, 0, 0, 0, 192, 193, 1, 0, 0, 0, 193, 194, 1, 0, 0, 0,
        194, 195, 5, 1, 0, 0, 195, 45, 1, 0, 0, 0, 196, 197, 3, 48, 24, 0, 197, 198, 3, 50, 25,
        0, 198, 47, 1, 0, 0, 0, 199, 200, 3, 54, 27, 0, 200, 201, 5, 3, 0, 0, 201, 202, 3, 54,
        27, 0, 202, 49, 1, 0, 0, 0, 203, 207, 5, 4, 0, 0, 204, 206, 3, 52, 26, 0, 205, 204, 1,
        0, 0, 0, 206, 209, 1, 0, 0, 0, 207, 205, 1, 0, 0, 0, 207, 208, 1, 0, 0, 0, 208, 210, 1,
        0, 0, 0, 209, 207, 1, 0, 0, 0, 210, 211, 5, 5, 0, 0, 211, 51, 1, 0, 0, 0, 212, 213, 5, 20,
        0, 0, 213, 214, 5, 27, 0, 0, 214, 215, 5, 1, 0, 0, 215, 53, 1, 0, 0, 0, 216, 220, 5, 23,
        0, 0, 217, 220, 5, 24, 0, 0, 218, 220, 3, 62, 31, 0, 219, 216, 1, 0, 0, 0, 219, 217, 1,
        0, 0, 0, 219, 218, 1, 0, 0, 0, 220, 55, 1, 0, 0, 0, 221, 222, 5, 21, 0, 0, 222, 223, 5,
        22, 0, 0, 223, 224, 5, 26, 0, 0, 224, 225, 5, 8, 0, 0, 225, 226, 5, 27, 0, 0, 226, 227,
        5, 1, 0, 0, 227, 57, 1, 0, 0, 0, 228, 229, 5, 26, 0, 0, 229, 59, 1, 0, 0, 0, 230, 231, 5,
        26, 0, 0, 231, 61, 1, 0, 0, 0, 232, 233, 5, 26, 0, 0, 233, 63, 1, 0, 0, 0, 234, 235, 7,
        0, 0, 0, 235, 65, 1, 0, 0, 0, 12, 78, 86, 100, 109, 124, 133, 158, 178, 185, 192, 207,
        219
    ];
    static __ATN;
    static get _ATN() {
        if (!ESPACEParser.__ATN) {
            ESPACEParser.__ATN = new antlr.ATNDeserializer().deserialize(ESPACEParser._serializedATN);
        }
        return ESPACEParser.__ATN;
    }
    static vocabulary = new antlr.Vocabulary(ESPACEParser.literalNames, ESPACEParser.symbolicNames, []);
    get vocabulary() {
        return ESPACEParser.vocabulary;
    }
    static decisionsToDFA = ESPACEParser._ATN.decisionToState.map((ds, index) => new antlr.DFA(ds, index));
}
export class ProgramContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    experimentDeclaration() {
        return this.getRuleContext(0, ExperimentDeclarationContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_program;
    }
    enterRule(listener) {
        if (listener.enterProgram) {
            listener.enterProgram(this);
        }
    }
    exitRule(listener) {
        if (listener.exitProgram) {
            listener.exitProgram(this);
        }
    }
    accept(visitor) {
        if (visitor.visitProgram) {
            return visitor.visitProgram(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ExperimentDeclarationContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    experimentHeader() {
        return this.getRuleContext(0, ExperimentHeaderContext);
    }
    experimentBody() {
        return this.getRuleContext(0, ExperimentBodyContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_experimentDeclaration;
    }
    enterRule(listener) {
        if (listener.enterExperimentDeclaration) {
            listener.enterExperimentDeclaration(this);
        }
    }
    exitRule(listener) {
        if (listener.exitExperimentDeclaration) {
            listener.exitExperimentDeclaration(this);
        }
    }
    accept(visitor) {
        if (visitor.visitExperimentDeclaration) {
            return visitor.visitExperimentDeclaration(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ExperimentHeaderContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    EXPERIMENT() {
        return this.getToken(ESPACEParser.EXPERIMENT, 0);
    }
    IDENTIFIER() {
        return this.getToken(ESPACEParser.IDENTIFIER, 0);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_experimentHeader;
    }
    enterRule(listener) {
        if (listener.enterExperimentHeader) {
            listener.enterExperimentHeader(this);
        }
    }
    exitRule(listener) {
        if (listener.exitExperimentHeader) {
            listener.exitExperimentHeader(this);
        }
    }
    accept(visitor) {
        if (visitor.visitExperimentHeader) {
            return visitor.visitExperimentHeader(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ExperimentBodyContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    LBRACE() {
        return this.getToken(ESPACEParser.LBRACE, 0);
    }
    RBRACE() {
        return this.getToken(ESPACEParser.RBRACE, 0);
    }
    experimentContent(i) {
        if (i === undefined) {
            return this.getRuleContexts(ExperimentContentContext);
        }
        return this.getRuleContext(i, ExperimentContentContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_experimentBody;
    }
    enterRule(listener) {
        if (listener.enterExperimentBody) {
            listener.enterExperimentBody(this);
        }
    }
    exitRule(listener) {
        if (listener.exitExperimentBody) {
            listener.exitExperimentBody(this);
        }
    }
    accept(visitor) {
        if (visitor.visitExperimentBody) {
            return visitor.visitExperimentBody(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ExperimentContentContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    spaceDeclaration() {
        return this.getRuleContext(0, SpaceDeclarationContext);
    }
    controlBlock() {
        return this.getRuleContext(0, ControlBlockContext);
    }
    dataDefinition() {
        return this.getRuleContext(0, DataDefinitionContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_experimentContent;
    }
    enterRule(listener) {
        if (listener.enterExperimentContent) {
            listener.enterExperimentContent(this);
        }
    }
    exitRule(listener) {
        if (listener.exitExperimentContent) {
            listener.exitExperimentContent(this);
        }
    }
    accept(visitor) {
        if (visitor.visitExperimentContent) {
            return visitor.visitExperimentContent(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class SpaceDeclarationContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    spaceHeader() {
        return this.getRuleContext(0, SpaceHeaderContext);
    }
    spaceBody() {
        return this.getRuleContext(0, SpaceBodyContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_spaceDeclaration;
    }
    enterRule(listener) {
        if (listener.enterSpaceDeclaration) {
            listener.enterSpaceDeclaration(this);
        }
    }
    exitRule(listener) {
        if (listener.exitSpaceDeclaration) {
            listener.exitSpaceDeclaration(this);
        }
    }
    accept(visitor) {
        if (visitor.visitSpaceDeclaration) {
            return visitor.visitSpaceDeclaration(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class SpaceHeaderContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    SPACE() {
        return this.getToken(ESPACEParser.SPACE, 0);
    }
    IDENTIFIER() {
        return this.getToken(ESPACEParser.IDENTIFIER, 0);
    }
    OF() {
        return this.getToken(ESPACEParser.OF, 0);
    }
    workflowNameRead() {
        return this.getRuleContext(0, WorkflowNameReadContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_spaceHeader;
    }
    enterRule(listener) {
        if (listener.enterSpaceHeader) {
            listener.enterSpaceHeader(this);
        }
    }
    exitRule(listener) {
        if (listener.exitSpaceHeader) {
            listener.exitSpaceHeader(this);
        }
    }
    accept(visitor) {
        if (visitor.visitSpaceHeader) {
            return visitor.visitSpaceHeader(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class SpaceBodyContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    LBRACE() {
        return this.getToken(ESPACEParser.LBRACE, 0);
    }
    RBRACE() {
        return this.getToken(ESPACEParser.RBRACE, 0);
    }
    spaceContent(i) {
        if (i === undefined) {
            return this.getRuleContexts(SpaceContentContext);
        }
        return this.getRuleContext(i, SpaceContentContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_spaceBody;
    }
    enterRule(listener) {
        if (listener.enterSpaceBody) {
            listener.enterSpaceBody(this);
        }
    }
    exitRule(listener) {
        if (listener.exitSpaceBody) {
            listener.exitSpaceBody(this);
        }
    }
    accept(visitor) {
        if (visitor.visitSpaceBody) {
            return visitor.visitSpaceBody(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class SpaceContentContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    strategyStatement() {
        return this.getRuleContext(0, StrategyStatementContext);
    }
    paramDefinition() {
        return this.getRuleContext(0, ParamDefinitionContext);
    }
    taskConfiguration() {
        return this.getRuleContext(0, TaskConfigurationContext);
    }
    dataDefinition() {
        return this.getRuleContext(0, DataDefinitionContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_spaceContent;
    }
    enterRule(listener) {
        if (listener.enterSpaceContent) {
            listener.enterSpaceContent(this);
        }
    }
    exitRule(listener) {
        if (listener.exitSpaceContent) {
            listener.exitSpaceContent(this);
        }
    }
    accept(visitor) {
        if (visitor.visitSpaceContent) {
            return visitor.visitSpaceContent(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class StrategyStatementContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    STRATEGY() {
        return this.getToken(ESPACEParser.STRATEGY, 0);
    }
    IDENTIFIER() {
        return this.getToken(ESPACEParser.IDENTIFIER, 0);
    }
    SEMICOLON() {
        return this.getToken(ESPACEParser.SEMICOLON, 0);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_strategyStatement;
    }
    enterRule(listener) {
        if (listener.enterStrategyStatement) {
            listener.enterStrategyStatement(this);
        }
    }
    exitRule(listener) {
        if (listener.exitStrategyStatement) {
            listener.exitStrategyStatement(this);
        }
    }
    accept(visitor) {
        if (visitor.visitStrategyStatement) {
            return visitor.visitStrategyStatement(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ParamDefinitionContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    PARAM() {
        return this.getToken(ESPACEParser.PARAM, 0);
    }
    IDENTIFIER() {
        return this.getToken(ESPACEParser.IDENTIFIER, 0);
    }
    EQUALS() {
        return this.getToken(ESPACEParser.EQUALS, 0);
    }
    paramValue() {
        return this.getRuleContext(0, ParamValueContext);
    }
    SEMICOLON() {
        return this.getToken(ESPACEParser.SEMICOLON, 0);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_paramDefinition;
    }
    enterRule(listener) {
        if (listener.enterParamDefinition) {
            listener.enterParamDefinition(this);
        }
    }
    exitRule(listener) {
        if (listener.exitParamDefinition) {
            listener.exitParamDefinition(this);
        }
    }
    accept(visitor) {
        if (visitor.visitParamDefinition) {
            return visitor.visitParamDefinition(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ParamValueContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    enumFunction() {
        return this.getRuleContext(0, EnumFunctionContext);
    }
    rangeFunction() {
        return this.getRuleContext(0, RangeFunctionContext);
    }
    expression() {
        return this.getRuleContext(0, ExpressionContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_paramValue;
    }
    enterRule(listener) {
        if (listener.enterParamValue) {
            listener.enterParamValue(this);
        }
    }
    exitRule(listener) {
        if (listener.exitParamValue) {
            listener.exitParamValue(this);
        }
    }
    accept(visitor) {
        if (visitor.visitParamValue) {
            return visitor.visitParamValue(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class EnumFunctionContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ENUM() {
        return this.getToken(ESPACEParser.ENUM, 0);
    }
    LPAREN() {
        return this.getToken(ESPACEParser.LPAREN, 0);
    }
    expression(i) {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        }
        return this.getRuleContext(i, ExpressionContext);
    }
    RPAREN() {
        return this.getToken(ESPACEParser.RPAREN, 0);
    }
    COMMA(i) {
        if (i === undefined) {
            return this.getTokens(ESPACEParser.COMMA);
        }
        else {
            return this.getToken(ESPACEParser.COMMA, i);
        }
    }
    get ruleIndex() {
        return ESPACEParser.RULE_enumFunction;
    }
    enterRule(listener) {
        if (listener.enterEnumFunction) {
            listener.enterEnumFunction(this);
        }
    }
    exitRule(listener) {
        if (listener.exitEnumFunction) {
            listener.exitEnumFunction(this);
        }
    }
    accept(visitor) {
        if (visitor.visitEnumFunction) {
            return visitor.visitEnumFunction(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class RangeFunctionContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    RANGE() {
        return this.getToken(ESPACEParser.RANGE, 0);
    }
    LPAREN() {
        return this.getToken(ESPACEParser.LPAREN, 0);
    }
    NUMBER(i) {
        if (i === undefined) {
            return this.getTokens(ESPACEParser.NUMBER);
        }
        else {
            return this.getToken(ESPACEParser.NUMBER, i);
        }
    }
    COMMA(i) {
        if (i === undefined) {
            return this.getTokens(ESPACEParser.COMMA);
        }
        else {
            return this.getToken(ESPACEParser.COMMA, i);
        }
    }
    RPAREN() {
        return this.getToken(ESPACEParser.RPAREN, 0);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_rangeFunction;
    }
    enterRule(listener) {
        if (listener.enterRangeFunction) {
            listener.enterRangeFunction(this);
        }
    }
    exitRule(listener) {
        if (listener.exitRangeFunction) {
            listener.exitRangeFunction(this);
        }
    }
    accept(visitor) {
        if (visitor.visitRangeFunction) {
            return visitor.visitRangeFunction(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class TaskConfigurationContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    taskConfigurationHeader() {
        return this.getRuleContext(0, TaskConfigurationHeaderContext);
    }
    taskConfigurationBody() {
        return this.getRuleContext(0, TaskConfigurationBodyContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_taskConfiguration;
    }
    enterRule(listener) {
        if (listener.enterTaskConfiguration) {
            listener.enterTaskConfiguration(this);
        }
    }
    exitRule(listener) {
        if (listener.exitTaskConfiguration) {
            listener.exitTaskConfiguration(this);
        }
    }
    accept(visitor) {
        if (visitor.visitTaskConfiguration) {
            return visitor.visitTaskConfiguration(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class TaskConfigurationHeaderContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    CONFIGURE() {
        return this.getToken(ESPACEParser.CONFIGURE, 0);
    }
    TASK() {
        return this.getToken(ESPACEParser.TASK, 0);
    }
    taskNameRead() {
        return this.getRuleContext(0, TaskNameReadContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_taskConfigurationHeader;
    }
    enterRule(listener) {
        if (listener.enterTaskConfigurationHeader) {
            listener.enterTaskConfigurationHeader(this);
        }
    }
    exitRule(listener) {
        if (listener.exitTaskConfigurationHeader) {
            listener.exitTaskConfigurationHeader(this);
        }
    }
    accept(visitor) {
        if (visitor.visitTaskConfigurationHeader) {
            return visitor.visitTaskConfigurationHeader(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class TaskConfigurationBodyContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    LBRACE() {
        return this.getToken(ESPACEParser.LBRACE, 0);
    }
    RBRACE() {
        return this.getToken(ESPACEParser.RBRACE, 0);
    }
    configurationContent(i) {
        if (i === undefined) {
            return this.getRuleContexts(ConfigurationContentContext);
        }
        return this.getRuleContext(i, ConfigurationContentContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_taskConfigurationBody;
    }
    enterRule(listener) {
        if (listener.enterTaskConfigurationBody) {
            listener.enterTaskConfigurationBody(this);
        }
    }
    exitRule(listener) {
        if (listener.exitTaskConfigurationBody) {
            listener.exitTaskConfigurationBody(this);
        }
    }
    accept(visitor) {
        if (visitor.visitTaskConfigurationBody) {
            return visitor.visitTaskConfigurationBody(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ConfigurationContentContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    paramAssignment() {
        return this.getRuleContext(0, ParamAssignmentContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_configurationContent;
    }
    enterRule(listener) {
        if (listener.enterConfigurationContent) {
            listener.enterConfigurationContent(this);
        }
    }
    exitRule(listener) {
        if (listener.exitConfigurationContent) {
            listener.exitConfigurationContent(this);
        }
    }
    accept(visitor) {
        if (visitor.visitConfigurationContent) {
            return visitor.visitConfigurationContent(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ParamAssignmentContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    PARAM() {
        return this.getToken(ESPACEParser.PARAM, 0);
    }
    IDENTIFIER() {
        return this.getToken(ESPACEParser.IDENTIFIER, 0);
    }
    EQUALS() {
        return this.getToken(ESPACEParser.EQUALS, 0);
    }
    paramValue() {
        return this.getRuleContext(0, ParamValueContext);
    }
    SEMICOLON() {
        return this.getToken(ESPACEParser.SEMICOLON, 0);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_paramAssignment;
    }
    enterRule(listener) {
        if (listener.enterParamAssignment) {
            listener.enterParamAssignment(this);
        }
    }
    exitRule(listener) {
        if (listener.exitParamAssignment) {
            listener.exitParamAssignment(this);
        }
    }
    accept(visitor) {
        if (visitor.visitParamAssignment) {
            return visitor.visitParamAssignment(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ControlBlockContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    CONTROL() {
        return this.getToken(ESPACEParser.CONTROL, 0);
    }
    controlBody() {
        return this.getRuleContext(0, ControlBodyContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_controlBlock;
    }
    enterRule(listener) {
        if (listener.enterControlBlock) {
            listener.enterControlBlock(this);
        }
    }
    exitRule(listener) {
        if (listener.exitControlBlock) {
            listener.exitControlBlock(this);
        }
    }
    accept(visitor) {
        if (visitor.visitControlBlock) {
            return visitor.visitControlBlock(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ControlBodyContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    LBRACE() {
        return this.getToken(ESPACEParser.LBRACE, 0);
    }
    RBRACE() {
        return this.getToken(ESPACEParser.RBRACE, 0);
    }
    controlContent(i) {
        if (i === undefined) {
            return this.getRuleContexts(ControlContentContext);
        }
        return this.getRuleContext(i, ControlContentContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_controlBody;
    }
    enterRule(listener) {
        if (listener.enterControlBody) {
            listener.enterControlBody(this);
        }
    }
    exitRule(listener) {
        if (listener.exitControlBody) {
            listener.exitControlBody(this);
        }
    }
    accept(visitor) {
        if (visitor.visitControlBody) {
            return visitor.visitControlBody(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ControlContentContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    simpleTransition() {
        return this.getRuleContext(0, SimpleTransitionContext);
    }
    conditionalTransition() {
        return this.getRuleContext(0, ConditionalTransitionContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_controlContent;
    }
    enterRule(listener) {
        if (listener.enterControlContent) {
            listener.enterControlContent(this);
        }
    }
    exitRule(listener) {
        if (listener.exitControlContent) {
            listener.exitControlContent(this);
        }
    }
    accept(visitor) {
        if (visitor.visitControlContent) {
            return visitor.visitControlContent(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class SimpleTransitionContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    controlChainElement(i) {
        if (i === undefined) {
            return this.getRuleContexts(ControlChainElementContext);
        }
        return this.getRuleContext(i, ControlChainElementContext);
    }
    SEMICOLON() {
        return this.getToken(ESPACEParser.SEMICOLON, 0);
    }
    ARROW(i) {
        if (i === undefined) {
            return this.getTokens(ESPACEParser.ARROW);
        }
        else {
            return this.getToken(ESPACEParser.ARROW, i);
        }
    }
    get ruleIndex() {
        return ESPACEParser.RULE_simpleTransition;
    }
    enterRule(listener) {
        if (listener.enterSimpleTransition) {
            listener.enterSimpleTransition(this);
        }
    }
    exitRule(listener) {
        if (listener.exitSimpleTransition) {
            listener.exitSimpleTransition(this);
        }
    }
    accept(visitor) {
        if (visitor.visitSimpleTransition) {
            return visitor.visitSimpleTransition(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ConditionalTransitionContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    conditionalTransitionHeader() {
        return this.getRuleContext(0, ConditionalTransitionHeaderContext);
    }
    conditionalTransitionBody() {
        return this.getRuleContext(0, ConditionalTransitionBodyContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_conditionalTransition;
    }
    enterRule(listener) {
        if (listener.enterConditionalTransition) {
            listener.enterConditionalTransition(this);
        }
    }
    exitRule(listener) {
        if (listener.exitConditionalTransition) {
            listener.exitConditionalTransition(this);
        }
    }
    accept(visitor) {
        if (visitor.visitConditionalTransition) {
            return visitor.visitConditionalTransition(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ConditionalTransitionHeaderContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    controlChainElement(i) {
        if (i === undefined) {
            return this.getRuleContexts(ControlChainElementContext);
        }
        return this.getRuleContext(i, ControlChainElementContext);
    }
    CONDITION_ARROW() {
        return this.getToken(ESPACEParser.CONDITION_ARROW, 0);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_conditionalTransitionHeader;
    }
    enterRule(listener) {
        if (listener.enterConditionalTransitionHeader) {
            listener.enterConditionalTransitionHeader(this);
        }
    }
    exitRule(listener) {
        if (listener.exitConditionalTransitionHeader) {
            listener.exitConditionalTransitionHeader(this);
        }
    }
    accept(visitor) {
        if (visitor.visitConditionalTransitionHeader) {
            return visitor.visitConditionalTransitionHeader(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ConditionalTransitionBodyContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    LBRACE() {
        return this.getToken(ESPACEParser.LBRACE, 0);
    }
    RBRACE() {
        return this.getToken(ESPACEParser.RBRACE, 0);
    }
    condition(i) {
        if (i === undefined) {
            return this.getRuleContexts(ConditionContext);
        }
        return this.getRuleContext(i, ConditionContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_conditionalTransitionBody;
    }
    enterRule(listener) {
        if (listener.enterConditionalTransitionBody) {
            listener.enterConditionalTransitionBody(this);
        }
    }
    exitRule(listener) {
        if (listener.exitConditionalTransitionBody) {
            listener.exitConditionalTransitionBody(this);
        }
    }
    accept(visitor) {
        if (visitor.visitConditionalTransitionBody) {
            return visitor.visitConditionalTransitionBody(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ConditionContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    CONDITION() {
        return this.getToken(ESPACEParser.CONDITION, 0);
    }
    STRING() {
        return this.getToken(ESPACEParser.STRING, 0);
    }
    SEMICOLON() {
        return this.getToken(ESPACEParser.SEMICOLON, 0);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_condition;
    }
    enterRule(listener) {
        if (listener.enterCondition) {
            listener.enterCondition(this);
        }
    }
    exitRule(listener) {
        if (listener.exitCondition) {
            listener.exitCondition(this);
        }
    }
    accept(visitor) {
        if (visitor.visitCondition) {
            return visitor.visitCondition(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ControlChainElementContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    START() {
        return this.getToken(ESPACEParser.START, 0);
    }
    END() {
        return this.getToken(ESPACEParser.END, 0);
    }
    spaceNameRead() {
        return this.getRuleContext(0, SpaceNameReadContext);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_controlChainElement;
    }
    enterRule(listener) {
        if (listener.enterControlChainElement) {
            listener.enterControlChainElement(this);
        }
    }
    exitRule(listener) {
        if (listener.exitControlChainElement) {
            listener.exitControlChainElement(this);
        }
    }
    accept(visitor) {
        if (visitor.visitControlChainElement) {
            return visitor.visitControlChainElement(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class DataDefinitionContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    DEFINE() {
        return this.getToken(ESPACEParser.DEFINE, 0);
    }
    DATA() {
        return this.getToken(ESPACEParser.DATA, 0);
    }
    IDENTIFIER() {
        return this.getToken(ESPACEParser.IDENTIFIER, 0);
    }
    EQUALS() {
        return this.getToken(ESPACEParser.EQUALS, 0);
    }
    STRING() {
        return this.getToken(ESPACEParser.STRING, 0);
    }
    SEMICOLON() {
        return this.getToken(ESPACEParser.SEMICOLON, 0);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_dataDefinition;
    }
    enterRule(listener) {
        if (listener.enterDataDefinition) {
            listener.enterDataDefinition(this);
        }
    }
    exitRule(listener) {
        if (listener.exitDataDefinition) {
            listener.exitDataDefinition(this);
        }
    }
    accept(visitor) {
        if (visitor.visitDataDefinition) {
            return visitor.visitDataDefinition(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class WorkflowNameReadContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    IDENTIFIER() {
        return this.getToken(ESPACEParser.IDENTIFIER, 0);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_workflowNameRead;
    }
    enterRule(listener) {
        if (listener.enterWorkflowNameRead) {
            listener.enterWorkflowNameRead(this);
        }
    }
    exitRule(listener) {
        if (listener.exitWorkflowNameRead) {
            listener.exitWorkflowNameRead(this);
        }
    }
    accept(visitor) {
        if (visitor.visitWorkflowNameRead) {
            return visitor.visitWorkflowNameRead(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class TaskNameReadContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    IDENTIFIER() {
        return this.getToken(ESPACEParser.IDENTIFIER, 0);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_taskNameRead;
    }
    enterRule(listener) {
        if (listener.enterTaskNameRead) {
            listener.enterTaskNameRead(this);
        }
    }
    exitRule(listener) {
        if (listener.exitTaskNameRead) {
            listener.exitTaskNameRead(this);
        }
    }
    accept(visitor) {
        if (visitor.visitTaskNameRead) {
            return visitor.visitTaskNameRead(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class SpaceNameReadContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    IDENTIFIER() {
        return this.getToken(ESPACEParser.IDENTIFIER, 0);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_spaceNameRead;
    }
    enterRule(listener) {
        if (listener.enterSpaceNameRead) {
            listener.enterSpaceNameRead(this);
        }
    }
    exitRule(listener) {
        if (listener.exitSpaceNameRead) {
            listener.exitSpaceNameRead(this);
        }
    }
    accept(visitor) {
        if (visitor.visitSpaceNameRead) {
            return visitor.visitSpaceNameRead(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ExpressionContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    NUMBER() {
        return this.getToken(ESPACEParser.NUMBER, 0);
    }
    STRING() {
        return this.getToken(ESPACEParser.STRING, 0);
    }
    BOOLEAN() {
        return this.getToken(ESPACEParser.BOOLEAN, 0);
    }
    get ruleIndex() {
        return ESPACEParser.RULE_expression;
    }
    enterRule(listener) {
        if (listener.enterExpression) {
            listener.enterExpression(this);
        }
    }
    exitRule(listener) {
        if (listener.exitExpression) {
            listener.exitExpression(this);
        }
    }
    accept(visitor) {
        if (visitor.visitExpression) {
            return visitor.visitExpression(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
//# sourceMappingURL=ESPACEParser.js.map