import * as antlr from "antlr4ng";
export class XXPParser extends antlr.Parser {
    static SEMICOLON = 1;
    static ARROW = 2;
    static LBRACE = 3;
    static RBRACE = 4;
    static EQUALS = 5;
    static COMMA = 6;
    static WORKFLOW = 7;
    static FROM = 8;
    static DATA = 9;
    static DEFINE = 10;
    static IMPLEMENTATION = 11;
    static PARAM = 12;
    static TASK = 13;
    static CONFIGURE = 14;
    static INPUT = 15;
    static OUTPUT = 16;
    static START = 17;
    static END = 18;
    static BOOLEAN = 19;
    static IDENTIFIER = 20;
    static STRING = 21;
    static NUMBER = 22;
    static WS = 23;
    static COMMENT = 24;
    static RULE_program = 0;
    static RULE_workflowDeclaration = 1;
    static RULE_workflowHeader = 2;
    static RULE_workflowBody = 3;
    static RULE_workflowContent = 4;
    static RULE_dataDefinition = 5;
    static RULE_taskDefinition = 6;
    static RULE_taskChain = 7;
    static RULE_chainElement = 8;
    static RULE_taskConfiguration = 9;
    static RULE_taskConfigurationHeader = 10;
    static RULE_taskConfigurationBody = 11;
    static RULE_configurationContent = 12;
    static RULE_implementation = 13;
    static RULE_paramAssignment = 14;
    static RULE_inputStatement = 15;
    static RULE_outputStatement = 16;
    static RULE_dataNameList = 17;
    static RULE_workflowNameRead = 18;
    static RULE_dataNameRead = 19;
    static RULE_taskNameRead = 20;
    static RULE_fileNameString = 21;
    static RULE_expression = 22;
    static literalNames = [
        null, "';'", "'->'", "'{'", "'}'", "'='", "','", "'workflow'", "'from'",
        "'data'", "'define'", "'implementation'", "'param'", "'task'", "'configure'",
        "'input'", "'output'", "'START'", "'END'"
    ];
    static symbolicNames = [
        null, "SEMICOLON", "ARROW", "LBRACE", "RBRACE", "EQUALS", "COMMA",
        "WORKFLOW", "FROM", "DATA", "DEFINE", "IMPLEMENTATION", "PARAM",
        "TASK", "CONFIGURE", "INPUT", "OUTPUT", "START", "END", "BOOLEAN",
        "IDENTIFIER", "STRING", "NUMBER", "WS", "COMMENT"
    ];
    static ruleNames = [
        "program", "workflowDeclaration", "workflowHeader", "workflowBody",
        "workflowContent", "dataDefinition", "taskDefinition", "taskChain",
        "chainElement", "taskConfiguration", "taskConfigurationHeader",
        "taskConfigurationBody", "configurationContent", "implementation",
        "paramAssignment", "inputStatement", "outputStatement", "dataNameList",
        "workflowNameRead", "dataNameRead", "taskNameRead", "fileNameString",
        "expression",
    ];
    get grammarFileName() { return "XXP.g4"; }
    get literalNames() { return XXPParser.literalNames; }
    get symbolicNames() { return XXPParser.symbolicNames; }
    get ruleNames() { return XXPParser.ruleNames; }
    get serializedATN() { return XXPParser._serializedATN; }
    createFailedPredicateException(predicate, message) {
        return new antlr.FailedPredicateException(this, predicate, message);
    }
    constructor(input) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, XXPParser._ATN, XXPParser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    program() {
        let localContext = new ProgramContext(this.context, this.state);
        this.enterRule(localContext, 0, XXPParser.RULE_program);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 46;
                this.workflowDeclaration();
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
    workflowDeclaration() {
        let localContext = new WorkflowDeclarationContext(this.context, this.state);
        this.enterRule(localContext, 2, XXPParser.RULE_workflowDeclaration);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 48;
                this.workflowHeader();
                this.state = 49;
                this.workflowBody();
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
    workflowHeader() {
        let localContext = new WorkflowHeaderContext(this.context, this.state);
        this.enterRule(localContext, 4, XXPParser.RULE_workflowHeader);
        let _la;
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 51;
                this.match(XXPParser.WORKFLOW);
                this.state = 52;
                this.match(XXPParser.IDENTIFIER);
                this.state = 55;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 8) {
                    {
                        this.state = 53;
                        this.match(XXPParser.FROM);
                        this.state = 54;
                        this.workflowNameRead();
                    }
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
    workflowBody() {
        let localContext = new WorkflowBodyContext(this.context, this.state);
        this.enterRule(localContext, 6, XXPParser.RULE_workflowBody);
        let _la;
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 57;
                this.match(XXPParser.LBRACE);
                this.state = 61;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1459200) !== 0)) {
                    {
                        {
                            this.state = 58;
                            this.workflowContent();
                        }
                    }
                    this.state = 63;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 64;
                this.match(XXPParser.RBRACE);
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
    workflowContent() {
        let localContext = new WorkflowContentContext(this.context, this.state);
        this.enterRule(localContext, 8, XXPParser.RULE_workflowContent);
        try {
            this.state = 70;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 2, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1);
                    {
                        this.state = 66;
                        this.dataDefinition();
                    }
                    break;
                case 2:
                    this.enterOuterAlt(localContext, 2);
                    {
                        this.state = 67;
                        this.taskDefinition();
                    }
                    break;
                case 3:
                    this.enterOuterAlt(localContext, 3);
                    {
                        this.state = 68;
                        this.taskChain();
                    }
                    break;
                case 4:
                    this.enterOuterAlt(localContext, 4);
                    {
                        this.state = 69;
                        this.taskConfiguration();
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
    dataDefinition() {
        let localContext = new DataDefinitionContext(this.context, this.state);
        this.enterRule(localContext, 10, XXPParser.RULE_dataDefinition);
        let _la;
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 72;
                this.match(XXPParser.DEFINE);
                this.state = 73;
                this.match(XXPParser.DATA);
                this.state = 74;
                this.match(XXPParser.IDENTIFIER);
                this.state = 77;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 5) {
                    {
                        this.state = 75;
                        this.match(XXPParser.EQUALS);
                        this.state = 76;
                        this.match(XXPParser.STRING);
                    }
                }
                this.state = 79;
                this.match(XXPParser.SEMICOLON);
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
    taskDefinition() {
        let localContext = new TaskDefinitionContext(this.context, this.state);
        this.enterRule(localContext, 12, XXPParser.RULE_taskDefinition);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 81;
                this.match(XXPParser.DEFINE);
                this.state = 82;
                this.match(XXPParser.TASK);
                this.state = 83;
                this.match(XXPParser.IDENTIFIER);
                this.state = 84;
                this.match(XXPParser.SEMICOLON);
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
    taskChain() {
        let localContext = new TaskChainContext(this.context, this.state);
        this.enterRule(localContext, 14, XXPParser.RULE_taskChain);
        let _la;
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 86;
                this.chainElement();
                this.state = 89;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                do {
                    {
                        {
                            this.state = 87;
                            this.match(XXPParser.ARROW);
                            this.state = 88;
                            this.chainElement();
                        }
                    }
                    this.state = 91;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                } while (_la === 2);
                this.state = 93;
                this.match(XXPParser.SEMICOLON);
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
    chainElement() {
        let localContext = new ChainElementContext(this.context, this.state);
        this.enterRule(localContext, 16, XXPParser.RULE_chainElement);
        try {
            this.state = 98;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
                case XXPParser.START:
                    this.enterOuterAlt(localContext, 1);
                    {
                        this.state = 95;
                        this.match(XXPParser.START);
                    }
                    break;
                case XXPParser.END:
                    this.enterOuterAlt(localContext, 2);
                    {
                        this.state = 96;
                        this.match(XXPParser.END);
                    }
                    break;
                case XXPParser.IDENTIFIER:
                    this.enterOuterAlt(localContext, 3);
                    {
                        this.state = 97;
                        this.taskNameRead();
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
    taskConfiguration() {
        let localContext = new TaskConfigurationContext(this.context, this.state);
        this.enterRule(localContext, 18, XXPParser.RULE_taskConfiguration);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 100;
                this.taskConfigurationHeader();
                this.state = 101;
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
        this.enterRule(localContext, 20, XXPParser.RULE_taskConfigurationHeader);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 103;
                this.match(XXPParser.CONFIGURE);
                this.state = 104;
                this.match(XXPParser.TASK);
                this.state = 105;
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
        this.enterRule(localContext, 22, XXPParser.RULE_taskConfigurationBody);
        let _la;
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 107;
                this.match(XXPParser.LBRACE);
                this.state = 111;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 104448) !== 0)) {
                    {
                        {
                            this.state = 108;
                            this.configurationContent();
                        }
                    }
                    this.state = 113;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 114;
                this.match(XXPParser.RBRACE);
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
        this.enterRule(localContext, 24, XXPParser.RULE_configurationContent);
        try {
            this.state = 120;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
                case XXPParser.IMPLEMENTATION:
                    this.enterOuterAlt(localContext, 1);
                    {
                        this.state = 116;
                        this.implementation();
                    }
                    break;
                case XXPParser.PARAM:
                    this.enterOuterAlt(localContext, 2);
                    {
                        this.state = 117;
                        this.paramAssignment();
                    }
                    break;
                case XXPParser.INPUT:
                    this.enterOuterAlt(localContext, 3);
                    {
                        this.state = 118;
                        this.inputStatement();
                    }
                    break;
                case XXPParser.OUTPUT:
                    this.enterOuterAlt(localContext, 4);
                    {
                        this.state = 119;
                        this.outputStatement();
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
    implementation() {
        let localContext = new ImplementationContext(this.context, this.state);
        this.enterRule(localContext, 26, XXPParser.RULE_implementation);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 122;
                this.match(XXPParser.IMPLEMENTATION);
                this.state = 123;
                this.fileNameString();
                this.state = 124;
                this.match(XXPParser.SEMICOLON);
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
        this.enterRule(localContext, 28, XXPParser.RULE_paramAssignment);
        let _la;
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 126;
                this.match(XXPParser.PARAM);
                this.state = 127;
                this.match(XXPParser.IDENTIFIER);
                this.state = 130;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 5) {
                    {
                        this.state = 128;
                        this.match(XXPParser.EQUALS);
                        this.state = 129;
                        this.expression();
                    }
                }
                this.state = 132;
                this.match(XXPParser.SEMICOLON);
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
    inputStatement() {
        let localContext = new InputStatementContext(this.context, this.state);
        this.enterRule(localContext, 30, XXPParser.RULE_inputStatement);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 134;
                this.match(XXPParser.INPUT);
                this.state = 135;
                this.dataNameList();
                this.state = 136;
                this.match(XXPParser.SEMICOLON);
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
    outputStatement() {
        let localContext = new OutputStatementContext(this.context, this.state);
        this.enterRule(localContext, 32, XXPParser.RULE_outputStatement);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 138;
                this.match(XXPParser.OUTPUT);
                this.state = 139;
                this.dataNameList();
                this.state = 140;
                this.match(XXPParser.SEMICOLON);
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
    dataNameList() {
        let localContext = new DataNameListContext(this.context, this.state);
        this.enterRule(localContext, 34, XXPParser.RULE_dataNameList);
        let _la;
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 142;
                this.dataNameRead();
                this.state = 147;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 6) {
                    {
                        {
                            this.state = 143;
                            this.match(XXPParser.COMMA);
                            this.state = 144;
                            this.dataNameRead();
                        }
                    }
                    this.state = 149;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
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
    workflowNameRead() {
        let localContext = new WorkflowNameReadContext(this.context, this.state);
        this.enterRule(localContext, 36, XXPParser.RULE_workflowNameRead);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 150;
                this.match(XXPParser.IDENTIFIER);
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
    dataNameRead() {
        let localContext = new DataNameReadContext(this.context, this.state);
        this.enterRule(localContext, 38, XXPParser.RULE_dataNameRead);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 152;
                this.match(XXPParser.IDENTIFIER);
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
        this.enterRule(localContext, 40, XXPParser.RULE_taskNameRead);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 154;
                this.match(XXPParser.IDENTIFIER);
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
    fileNameString() {
        let localContext = new FileNameStringContext(this.context, this.state);
        this.enterRule(localContext, 42, XXPParser.RULE_fileNameString);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 156;
                this.match(XXPParser.STRING);
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
        this.enterRule(localContext, 44, XXPParser.RULE_expression);
        let _la;
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 158;
                _la = this.tokenStream.LA(1);
                if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & 6815744) !== 0))) {
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
        4, 1, 24, 161, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 2, 6, 7,
        6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2, 10, 7, 10, 2, 11, 7, 11, 2, 12, 7, 12, 2, 13, 7, 13,
        2, 14, 7, 14, 2, 15, 7, 15, 2, 16, 7, 16, 2, 17, 7, 17, 2, 18, 7, 18, 2, 19, 7, 19, 2, 20,
        7, 20, 2, 21, 7, 21, 2, 22, 7, 22, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 2, 3, 2,
        56, 8, 2, 1, 3, 1, 3, 5, 3, 60, 8, 3, 10, 3, 12, 3, 63, 9, 3, 1, 3, 1, 3, 1, 4, 1, 4, 1, 4, 1,
        4, 3, 4, 71, 8, 4, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 3, 5, 78, 8, 5, 1, 5, 1, 5, 1, 6, 1, 6, 1, 6,
        1, 6, 1, 6, 1, 7, 1, 7, 1, 7, 4, 7, 90, 8, 7, 11, 7, 12, 7, 91, 1, 7, 1, 7, 1, 8, 1, 8, 1, 8,
        3, 8, 99, 8, 8, 1, 9, 1, 9, 1, 9, 1, 10, 1, 10, 1, 10, 1, 10, 1, 11, 1, 11, 5, 11, 110, 8,
        11, 10, 11, 12, 11, 113, 9, 11, 1, 11, 1, 11, 1, 12, 1, 12, 1, 12, 1, 12, 3, 12, 121, 8,
        12, 1, 13, 1, 13, 1, 13, 1, 13, 1, 14, 1, 14, 1, 14, 1, 14, 3, 14, 131, 8, 14, 1, 14, 1,
        14, 1, 15, 1, 15, 1, 15, 1, 15, 1, 16, 1, 16, 1, 16, 1, 16, 1, 17, 1, 17, 1, 17, 5, 17, 146,
        8, 17, 10, 17, 12, 17, 149, 9, 17, 1, 18, 1, 18, 1, 19, 1, 19, 1, 20, 1, 20, 1, 21, 1, 21,
        1, 22, 1, 22, 1, 22, 0, 0, 23, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30,
        32, 34, 36, 38, 40, 42, 44, 0, 1, 2, 0, 19, 19, 21, 22, 152, 0, 46, 1, 0, 0, 0, 2, 48, 1,
        0, 0, 0, 4, 51, 1, 0, 0, 0, 6, 57, 1, 0, 0, 0, 8, 70, 1, 0, 0, 0, 10, 72, 1, 0, 0, 0, 12, 81,
        1, 0, 0, 0, 14, 86, 1, 0, 0, 0, 16, 98, 1, 0, 0, 0, 18, 100, 1, 0, 0, 0, 20, 103, 1, 0, 0,
        0, 22, 107, 1, 0, 0, 0, 24, 120, 1, 0, 0, 0, 26, 122, 1, 0, 0, 0, 28, 126, 1, 0, 0, 0, 30,
        134, 1, 0, 0, 0, 32, 138, 1, 0, 0, 0, 34, 142, 1, 0, 0, 0, 36, 150, 1, 0, 0, 0, 38, 152,
        1, 0, 0, 0, 40, 154, 1, 0, 0, 0, 42, 156, 1, 0, 0, 0, 44, 158, 1, 0, 0, 0, 46, 47, 3, 2, 1,
        0, 47, 1, 1, 0, 0, 0, 48, 49, 3, 4, 2, 0, 49, 50, 3, 6, 3, 0, 50, 3, 1, 0, 0, 0, 51, 52, 5,
        7, 0, 0, 52, 55, 5, 20, 0, 0, 53, 54, 5, 8, 0, 0, 54, 56, 3, 36, 18, 0, 55, 53, 1, 0, 0, 0,
        55, 56, 1, 0, 0, 0, 56, 5, 1, 0, 0, 0, 57, 61, 5, 3, 0, 0, 58, 60, 3, 8, 4, 0, 59, 58, 1, 0,
        0, 0, 60, 63, 1, 0, 0, 0, 61, 59, 1, 0, 0, 0, 61, 62, 1, 0, 0, 0, 62, 64, 1, 0, 0, 0, 63, 61,
        1, 0, 0, 0, 64, 65, 5, 4, 0, 0, 65, 7, 1, 0, 0, 0, 66, 71, 3, 10, 5, 0, 67, 71, 3, 12, 6, 0,
        68, 71, 3, 14, 7, 0, 69, 71, 3, 18, 9, 0, 70, 66, 1, 0, 0, 0, 70, 67, 1, 0, 0, 0, 70, 68,
        1, 0, 0, 0, 70, 69, 1, 0, 0, 0, 71, 9, 1, 0, 0, 0, 72, 73, 5, 10, 0, 0, 73, 74, 5, 9, 0, 0,
        74, 77, 5, 20, 0, 0, 75, 76, 5, 5, 0, 0, 76, 78, 5, 21, 0, 0, 77, 75, 1, 0, 0, 0, 77, 78,
        1, 0, 0, 0, 78, 79, 1, 0, 0, 0, 79, 80, 5, 1, 0, 0, 80, 11, 1, 0, 0, 0, 81, 82, 5, 10, 0, 0,
        82, 83, 5, 13, 0, 0, 83, 84, 5, 20, 0, 0, 84, 85, 5, 1, 0, 0, 85, 13, 1, 0, 0, 0, 86, 89,
        3, 16, 8, 0, 87, 88, 5, 2, 0, 0, 88, 90, 3, 16, 8, 0, 89, 87, 1, 0, 0, 0, 90, 91, 1, 0, 0,
        0, 91, 89, 1, 0, 0, 0, 91, 92, 1, 0, 0, 0, 92, 93, 1, 0, 0, 0, 93, 94, 5, 1, 0, 0, 94, 15,
        1, 0, 0, 0, 95, 99, 5, 17, 0, 0, 96, 99, 5, 18, 0, 0, 97, 99, 3, 40, 20, 0, 98, 95, 1, 0,
        0, 0, 98, 96, 1, 0, 0, 0, 98, 97, 1, 0, 0, 0, 99, 17, 1, 0, 0, 0, 100, 101, 3, 20, 10, 0,
        101, 102, 3, 22, 11, 0, 102, 19, 1, 0, 0, 0, 103, 104, 5, 14, 0, 0, 104, 105, 5, 13, 0,
        0, 105, 106, 3, 40, 20, 0, 106, 21, 1, 0, 0, 0, 107, 111, 5, 3, 0, 0, 108, 110, 3, 24,
        12, 0, 109, 108, 1, 0, 0, 0, 110, 113, 1, 0, 0, 0, 111, 109, 1, 0, 0, 0, 111, 112, 1, 0,
        0, 0, 112, 114, 1, 0, 0, 0, 113, 111, 1, 0, 0, 0, 114, 115, 5, 4, 0, 0, 115, 23, 1, 0, 0,
        0, 116, 121, 3, 26, 13, 0, 117, 121, 3, 28, 14, 0, 118, 121, 3, 30, 15, 0, 119, 121,
        3, 32, 16, 0, 120, 116, 1, 0, 0, 0, 120, 117, 1, 0, 0, 0, 120, 118, 1, 0, 0, 0, 120, 119,
        1, 0, 0, 0, 121, 25, 1, 0, 0, 0, 122, 123, 5, 11, 0, 0, 123, 124, 3, 42, 21, 0, 124, 125,
        5, 1, 0, 0, 125, 27, 1, 0, 0, 0, 126, 127, 5, 12, 0, 0, 127, 130, 5, 20, 0, 0, 128, 129,
        5, 5, 0, 0, 129, 131, 3, 44, 22, 0, 130, 128, 1, 0, 0, 0, 130, 131, 1, 0, 0, 0, 131, 132,
        1, 0, 0, 0, 132, 133, 5, 1, 0, 0, 133, 29, 1, 0, 0, 0, 134, 135, 5, 15, 0, 0, 135, 136,
        3, 34, 17, 0, 136, 137, 5, 1, 0, 0, 137, 31, 1, 0, 0, 0, 138, 139, 5, 16, 0, 0, 139, 140,
        3, 34, 17, 0, 140, 141, 5, 1, 0, 0, 141, 33, 1, 0, 0, 0, 142, 147, 3, 38, 19, 0, 143, 144,
        5, 6, 0, 0, 144, 146, 3, 38, 19, 0, 145, 143, 1, 0, 0, 0, 146, 149, 1, 0, 0, 0, 147, 145,
        1, 0, 0, 0, 147, 148, 1, 0, 0, 0, 148, 35, 1, 0, 0, 0, 149, 147, 1, 0, 0, 0, 150, 151, 5,
        20, 0, 0, 151, 37, 1, 0, 0, 0, 152, 153, 5, 20, 0, 0, 153, 39, 1, 0, 0, 0, 154, 155, 5,
        20, 0, 0, 155, 41, 1, 0, 0, 0, 156, 157, 5, 21, 0, 0, 157, 43, 1, 0, 0, 0, 158, 159, 7,
        0, 0, 0, 159, 45, 1, 0, 0, 0, 10, 55, 61, 70, 77, 91, 98, 111, 120, 130, 147
    ];
    static __ATN;
    static get _ATN() {
        if (!XXPParser.__ATN) {
            XXPParser.__ATN = new antlr.ATNDeserializer().deserialize(XXPParser._serializedATN);
        }
        return XXPParser.__ATN;
    }
    static vocabulary = new antlr.Vocabulary(XXPParser.literalNames, XXPParser.symbolicNames, []);
    get vocabulary() {
        return XXPParser.vocabulary;
    }
    static decisionsToDFA = XXPParser._ATN.decisionToState.map((ds, index) => new antlr.DFA(ds, index));
}
export class ProgramContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    workflowDeclaration() {
        return this.getRuleContext(0, WorkflowDeclarationContext);
    }
    get ruleIndex() {
        return XXPParser.RULE_program;
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
export class WorkflowDeclarationContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    workflowHeader() {
        return this.getRuleContext(0, WorkflowHeaderContext);
    }
    workflowBody() {
        return this.getRuleContext(0, WorkflowBodyContext);
    }
    get ruleIndex() {
        return XXPParser.RULE_workflowDeclaration;
    }
    enterRule(listener) {
        if (listener.enterWorkflowDeclaration) {
            listener.enterWorkflowDeclaration(this);
        }
    }
    exitRule(listener) {
        if (listener.exitWorkflowDeclaration) {
            listener.exitWorkflowDeclaration(this);
        }
    }
    accept(visitor) {
        if (visitor.visitWorkflowDeclaration) {
            return visitor.visitWorkflowDeclaration(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class WorkflowHeaderContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    WORKFLOW() {
        return this.getToken(XXPParser.WORKFLOW, 0);
    }
    IDENTIFIER() {
        return this.getToken(XXPParser.IDENTIFIER, 0);
    }
    FROM() {
        return this.getToken(XXPParser.FROM, 0);
    }
    workflowNameRead() {
        return this.getRuleContext(0, WorkflowNameReadContext);
    }
    get ruleIndex() {
        return XXPParser.RULE_workflowHeader;
    }
    enterRule(listener) {
        if (listener.enterWorkflowHeader) {
            listener.enterWorkflowHeader(this);
        }
    }
    exitRule(listener) {
        if (listener.exitWorkflowHeader) {
            listener.exitWorkflowHeader(this);
        }
    }
    accept(visitor) {
        if (visitor.visitWorkflowHeader) {
            return visitor.visitWorkflowHeader(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class WorkflowBodyContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    LBRACE() {
        return this.getToken(XXPParser.LBRACE, 0);
    }
    RBRACE() {
        return this.getToken(XXPParser.RBRACE, 0);
    }
    workflowContent(i) {
        if (i === undefined) {
            return this.getRuleContexts(WorkflowContentContext);
        }
        return this.getRuleContext(i, WorkflowContentContext);
    }
    get ruleIndex() {
        return XXPParser.RULE_workflowBody;
    }
    enterRule(listener) {
        if (listener.enterWorkflowBody) {
            listener.enterWorkflowBody(this);
        }
    }
    exitRule(listener) {
        if (listener.exitWorkflowBody) {
            listener.exitWorkflowBody(this);
        }
    }
    accept(visitor) {
        if (visitor.visitWorkflowBody) {
            return visitor.visitWorkflowBody(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class WorkflowContentContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    dataDefinition() {
        return this.getRuleContext(0, DataDefinitionContext);
    }
    taskDefinition() {
        return this.getRuleContext(0, TaskDefinitionContext);
    }
    taskChain() {
        return this.getRuleContext(0, TaskChainContext);
    }
    taskConfiguration() {
        return this.getRuleContext(0, TaskConfigurationContext);
    }
    get ruleIndex() {
        return XXPParser.RULE_workflowContent;
    }
    enterRule(listener) {
        if (listener.enterWorkflowContent) {
            listener.enterWorkflowContent(this);
        }
    }
    exitRule(listener) {
        if (listener.exitWorkflowContent) {
            listener.exitWorkflowContent(this);
        }
    }
    accept(visitor) {
        if (visitor.visitWorkflowContent) {
            return visitor.visitWorkflowContent(this);
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
        return this.getToken(XXPParser.DEFINE, 0);
    }
    DATA() {
        return this.getToken(XXPParser.DATA, 0);
    }
    IDENTIFIER() {
        return this.getToken(XXPParser.IDENTIFIER, 0);
    }
    SEMICOLON() {
        return this.getToken(XXPParser.SEMICOLON, 0);
    }
    EQUALS() {
        return this.getToken(XXPParser.EQUALS, 0);
    }
    STRING() {
        return this.getToken(XXPParser.STRING, 0);
    }
    get ruleIndex() {
        return XXPParser.RULE_dataDefinition;
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
export class TaskDefinitionContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    DEFINE() {
        return this.getToken(XXPParser.DEFINE, 0);
    }
    TASK() {
        return this.getToken(XXPParser.TASK, 0);
    }
    IDENTIFIER() {
        return this.getToken(XXPParser.IDENTIFIER, 0);
    }
    SEMICOLON() {
        return this.getToken(XXPParser.SEMICOLON, 0);
    }
    get ruleIndex() {
        return XXPParser.RULE_taskDefinition;
    }
    enterRule(listener) {
        if (listener.enterTaskDefinition) {
            listener.enterTaskDefinition(this);
        }
    }
    exitRule(listener) {
        if (listener.exitTaskDefinition) {
            listener.exitTaskDefinition(this);
        }
    }
    accept(visitor) {
        if (visitor.visitTaskDefinition) {
            return visitor.visitTaskDefinition(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class TaskChainContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    chainElement(i) {
        if (i === undefined) {
            return this.getRuleContexts(ChainElementContext);
        }
        return this.getRuleContext(i, ChainElementContext);
    }
    SEMICOLON() {
        return this.getToken(XXPParser.SEMICOLON, 0);
    }
    ARROW(i) {
        if (i === undefined) {
            return this.getTokens(XXPParser.ARROW);
        }
        else {
            return this.getToken(XXPParser.ARROW, i);
        }
    }
    get ruleIndex() {
        return XXPParser.RULE_taskChain;
    }
    enterRule(listener) {
        if (listener.enterTaskChain) {
            listener.enterTaskChain(this);
        }
    }
    exitRule(listener) {
        if (listener.exitTaskChain) {
            listener.exitTaskChain(this);
        }
    }
    accept(visitor) {
        if (visitor.visitTaskChain) {
            return visitor.visitTaskChain(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ChainElementContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    START() {
        return this.getToken(XXPParser.START, 0);
    }
    END() {
        return this.getToken(XXPParser.END, 0);
    }
    taskNameRead() {
        return this.getRuleContext(0, TaskNameReadContext);
    }
    get ruleIndex() {
        return XXPParser.RULE_chainElement;
    }
    enterRule(listener) {
        if (listener.enterChainElement) {
            listener.enterChainElement(this);
        }
    }
    exitRule(listener) {
        if (listener.exitChainElement) {
            listener.exitChainElement(this);
        }
    }
    accept(visitor) {
        if (visitor.visitChainElement) {
            return visitor.visitChainElement(this);
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
        return XXPParser.RULE_taskConfiguration;
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
        return this.getToken(XXPParser.CONFIGURE, 0);
    }
    TASK() {
        return this.getToken(XXPParser.TASK, 0);
    }
    taskNameRead() {
        return this.getRuleContext(0, TaskNameReadContext);
    }
    get ruleIndex() {
        return XXPParser.RULE_taskConfigurationHeader;
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
        return this.getToken(XXPParser.LBRACE, 0);
    }
    RBRACE() {
        return this.getToken(XXPParser.RBRACE, 0);
    }
    configurationContent(i) {
        if (i === undefined) {
            return this.getRuleContexts(ConfigurationContentContext);
        }
        return this.getRuleContext(i, ConfigurationContentContext);
    }
    get ruleIndex() {
        return XXPParser.RULE_taskConfigurationBody;
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
    implementation() {
        return this.getRuleContext(0, ImplementationContext);
    }
    paramAssignment() {
        return this.getRuleContext(0, ParamAssignmentContext);
    }
    inputStatement() {
        return this.getRuleContext(0, InputStatementContext);
    }
    outputStatement() {
        return this.getRuleContext(0, OutputStatementContext);
    }
    get ruleIndex() {
        return XXPParser.RULE_configurationContent;
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
export class ImplementationContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    IMPLEMENTATION() {
        return this.getToken(XXPParser.IMPLEMENTATION, 0);
    }
    fileNameString() {
        return this.getRuleContext(0, FileNameStringContext);
    }
    SEMICOLON() {
        return this.getToken(XXPParser.SEMICOLON, 0);
    }
    get ruleIndex() {
        return XXPParser.RULE_implementation;
    }
    enterRule(listener) {
        if (listener.enterImplementation) {
            listener.enterImplementation(this);
        }
    }
    exitRule(listener) {
        if (listener.exitImplementation) {
            listener.exitImplementation(this);
        }
    }
    accept(visitor) {
        if (visitor.visitImplementation) {
            return visitor.visitImplementation(this);
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
        return this.getToken(XXPParser.PARAM, 0);
    }
    IDENTIFIER() {
        return this.getToken(XXPParser.IDENTIFIER, 0);
    }
    SEMICOLON() {
        return this.getToken(XXPParser.SEMICOLON, 0);
    }
    EQUALS() {
        return this.getToken(XXPParser.EQUALS, 0);
    }
    expression() {
        return this.getRuleContext(0, ExpressionContext);
    }
    get ruleIndex() {
        return XXPParser.RULE_paramAssignment;
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
export class InputStatementContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    INPUT() {
        return this.getToken(XXPParser.INPUT, 0);
    }
    dataNameList() {
        return this.getRuleContext(0, DataNameListContext);
    }
    SEMICOLON() {
        return this.getToken(XXPParser.SEMICOLON, 0);
    }
    get ruleIndex() {
        return XXPParser.RULE_inputStatement;
    }
    enterRule(listener) {
        if (listener.enterInputStatement) {
            listener.enterInputStatement(this);
        }
    }
    exitRule(listener) {
        if (listener.exitInputStatement) {
            listener.exitInputStatement(this);
        }
    }
    accept(visitor) {
        if (visitor.visitInputStatement) {
            return visitor.visitInputStatement(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class OutputStatementContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    OUTPUT() {
        return this.getToken(XXPParser.OUTPUT, 0);
    }
    dataNameList() {
        return this.getRuleContext(0, DataNameListContext);
    }
    SEMICOLON() {
        return this.getToken(XXPParser.SEMICOLON, 0);
    }
    get ruleIndex() {
        return XXPParser.RULE_outputStatement;
    }
    enterRule(listener) {
        if (listener.enterOutputStatement) {
            listener.enterOutputStatement(this);
        }
    }
    exitRule(listener) {
        if (listener.exitOutputStatement) {
            listener.exitOutputStatement(this);
        }
    }
    accept(visitor) {
        if (visitor.visitOutputStatement) {
            return visitor.visitOutputStatement(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class DataNameListContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    dataNameRead(i) {
        if (i === undefined) {
            return this.getRuleContexts(DataNameReadContext);
        }
        return this.getRuleContext(i, DataNameReadContext);
    }
    COMMA(i) {
        if (i === undefined) {
            return this.getTokens(XXPParser.COMMA);
        }
        else {
            return this.getToken(XXPParser.COMMA, i);
        }
    }
    get ruleIndex() {
        return XXPParser.RULE_dataNameList;
    }
    enterRule(listener) {
        if (listener.enterDataNameList) {
            listener.enterDataNameList(this);
        }
    }
    exitRule(listener) {
        if (listener.exitDataNameList) {
            listener.exitDataNameList(this);
        }
    }
    accept(visitor) {
        if (visitor.visitDataNameList) {
            return visitor.visitDataNameList(this);
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
        return this.getToken(XXPParser.IDENTIFIER, 0);
    }
    get ruleIndex() {
        return XXPParser.RULE_workflowNameRead;
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
export class DataNameReadContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    IDENTIFIER() {
        return this.getToken(XXPParser.IDENTIFIER, 0);
    }
    get ruleIndex() {
        return XXPParser.RULE_dataNameRead;
    }
    enterRule(listener) {
        if (listener.enterDataNameRead) {
            listener.enterDataNameRead(this);
        }
    }
    exitRule(listener) {
        if (listener.exitDataNameRead) {
            listener.exitDataNameRead(this);
        }
    }
    accept(visitor) {
        if (visitor.visitDataNameRead) {
            return visitor.visitDataNameRead(this);
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
        return this.getToken(XXPParser.IDENTIFIER, 0);
    }
    get ruleIndex() {
        return XXPParser.RULE_taskNameRead;
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
export class FileNameStringContext extends antlr.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    STRING() {
        return this.getToken(XXPParser.STRING, 0);
    }
    get ruleIndex() {
        return XXPParser.RULE_fileNameString;
    }
    enterRule(listener) {
        if (listener.enterFileNameString) {
            listener.enterFileNameString(this);
        }
    }
    exitRule(listener) {
        if (listener.exitFileNameString) {
            listener.exitFileNameString(this);
        }
    }
    accept(visitor) {
        if (visitor.visitFileNameString) {
            return visitor.visitFileNameString(this);
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
        return this.getToken(XXPParser.NUMBER, 0);
    }
    STRING() {
        return this.getToken(XXPParser.STRING, 0);
    }
    BOOLEAN() {
        return this.getToken(XXPParser.BOOLEAN, 0);
    }
    get ruleIndex() {
        return XXPParser.RULE_expression;
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
//# sourceMappingURL=XXPParser.js.map