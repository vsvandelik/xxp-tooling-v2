// Generated from src/language/grammar/XXP.g4 by ANTLR 4.13.1

import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";


export class XXPLexer extends antlr.Lexer {
    public static readonly SEMICOLON = 1;
    public static readonly ARROW = 2;
    public static readonly LBRACE = 3;
    public static readonly RBRACE = 4;
    public static readonly EQUALS = 5;
    public static readonly COMMA = 6;
    public static readonly WORKFLOW = 7;
    public static readonly FROM = 8;
    public static readonly DATA = 9;
    public static readonly DEFINE = 10;
    public static readonly IMPLEMENTATION = 11;
    public static readonly PARAM = 12;
    public static readonly TASK = 13;
    public static readonly CONFIGURE = 14;
    public static readonly INPUT = 15;
    public static readonly OUTPUT = 16;
    public static readonly START = 17;
    public static readonly END = 18;
    public static readonly IDENTIFIER = 19;
    public static readonly STRING = 20;
    public static readonly NUMBER = 21;
    public static readonly WS = 22;
    public static readonly COMMENT = 23;

    public static readonly channelNames = [
        "DEFAULT_TOKEN_CHANNEL", "HIDDEN"
    ];

    public static readonly literalNames = [
        null, "';'", "'->'", "'{'", "'}'", "'='", "','", "'workflow'", "'from'", 
        "'data'", "'define'", "'implementation'", "'param'", "'task'", "'configure'", 
        "'input'", "'output'", "'START'", "'END'"
    ];

    public static readonly symbolicNames = [
        null, "SEMICOLON", "ARROW", "LBRACE", "RBRACE", "EQUALS", "COMMA", 
        "WORKFLOW", "FROM", "DATA", "DEFINE", "IMPLEMENTATION", "PARAM", 
        "TASK", "CONFIGURE", "INPUT", "OUTPUT", "START", "END", "IDENTIFIER", 
        "STRING", "NUMBER", "WS", "COMMENT"
    ];

    public static readonly modeNames = [
        "DEFAULT_MODE",
    ];

    public static readonly ruleNames = [
        "SEMICOLON", "ARROW", "LBRACE", "RBRACE", "EQUALS", "COMMA", "WORKFLOW", 
        "FROM", "DATA", "DEFINE", "IMPLEMENTATION", "PARAM", "TASK", "CONFIGURE", 
        "INPUT", "OUTPUT", "START", "END", "LETTER", "DIGIT", "IDENTIFIER", 
        "STRING", "NUMBER", "WS", "COMMENT",
    ];


    public constructor(input: antlr.CharStream) {
        super(input);
        this.interpreter = new antlr.LexerATNSimulator(this, XXPLexer._ATN, XXPLexer.decisionsToDFA, new antlr.PredictionContextCache());
    }

    public get grammarFileName(): string { return "XXP.g4"; }

    public get literalNames(): (string | null)[] { return XXPLexer.literalNames; }
    public get symbolicNames(): (string | null)[] { return XXPLexer.symbolicNames; }
    public get ruleNames(): string[] { return XXPLexer.ruleNames; }

    public get serializedATN(): number[] { return XXPLexer._serializedATN; }

    public get channelNames(): string[] { return XXPLexer.channelNames; }

    public get modeNames(): string[] { return XXPLexer.modeNames; }

    public static readonly _serializedATN: number[] = [
        4,0,23,201,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,
        2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,
        13,7,13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,
        19,2,20,7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,1,0,1,0,1,1,
        1,1,1,1,1,2,1,2,1,3,1,3,1,4,1,4,1,5,1,5,1,6,1,6,1,6,1,6,1,6,1,6,
        1,6,1,6,1,6,1,7,1,7,1,7,1,7,1,7,1,8,1,8,1,8,1,8,1,8,1,9,1,9,1,9,
        1,9,1,9,1,9,1,9,1,10,1,10,1,10,1,10,1,10,1,10,1,10,1,10,1,10,1,10,
        1,10,1,10,1,10,1,10,1,10,1,11,1,11,1,11,1,11,1,11,1,11,1,12,1,12,
        1,12,1,12,1,12,1,13,1,13,1,13,1,13,1,13,1,13,1,13,1,13,1,13,1,13,
        1,14,1,14,1,14,1,14,1,14,1,14,1,15,1,15,1,15,1,15,1,15,1,15,1,15,
        1,16,1,16,1,16,1,16,1,16,1,16,1,17,1,17,1,17,1,17,1,18,1,18,1,19,
        1,19,1,20,1,20,1,20,5,20,157,8,20,10,20,12,20,160,9,20,1,21,1,21,
        5,21,164,8,21,10,21,12,21,167,9,21,1,21,1,21,1,22,4,22,172,8,22,
        11,22,12,22,173,1,22,1,22,4,22,178,8,22,11,22,12,22,179,3,22,182,
        8,22,1,23,4,23,185,8,23,11,23,12,23,186,1,23,1,23,1,24,1,24,1,24,
        1,24,5,24,195,8,24,10,24,12,24,198,9,24,1,24,1,24,0,0,25,1,1,3,2,
        5,3,7,4,9,5,11,6,13,7,15,8,17,9,19,10,21,11,23,12,25,13,27,14,29,
        15,31,16,33,17,35,18,37,0,39,0,41,19,43,20,45,21,47,22,49,23,1,0,
        5,3,0,65,90,95,95,97,122,1,0,48,57,1,0,34,34,3,0,9,10,13,13,32,32,
        2,0,10,10,13,13,206,0,1,1,0,0,0,0,3,1,0,0,0,0,5,1,0,0,0,0,7,1,0,
        0,0,0,9,1,0,0,0,0,11,1,0,0,0,0,13,1,0,0,0,0,15,1,0,0,0,0,17,1,0,
        0,0,0,19,1,0,0,0,0,21,1,0,0,0,0,23,1,0,0,0,0,25,1,0,0,0,0,27,1,0,
        0,0,0,29,1,0,0,0,0,31,1,0,0,0,0,33,1,0,0,0,0,35,1,0,0,0,0,41,1,0,
        0,0,0,43,1,0,0,0,0,45,1,0,0,0,0,47,1,0,0,0,0,49,1,0,0,0,1,51,1,0,
        0,0,3,53,1,0,0,0,5,56,1,0,0,0,7,58,1,0,0,0,9,60,1,0,0,0,11,62,1,
        0,0,0,13,64,1,0,0,0,15,73,1,0,0,0,17,78,1,0,0,0,19,83,1,0,0,0,21,
        90,1,0,0,0,23,105,1,0,0,0,25,111,1,0,0,0,27,116,1,0,0,0,29,126,1,
        0,0,0,31,132,1,0,0,0,33,139,1,0,0,0,35,145,1,0,0,0,37,149,1,0,0,
        0,39,151,1,0,0,0,41,153,1,0,0,0,43,161,1,0,0,0,45,171,1,0,0,0,47,
        184,1,0,0,0,49,190,1,0,0,0,51,52,5,59,0,0,52,2,1,0,0,0,53,54,5,45,
        0,0,54,55,5,62,0,0,55,4,1,0,0,0,56,57,5,123,0,0,57,6,1,0,0,0,58,
        59,5,125,0,0,59,8,1,0,0,0,60,61,5,61,0,0,61,10,1,0,0,0,62,63,5,44,
        0,0,63,12,1,0,0,0,64,65,5,119,0,0,65,66,5,111,0,0,66,67,5,114,0,
        0,67,68,5,107,0,0,68,69,5,102,0,0,69,70,5,108,0,0,70,71,5,111,0,
        0,71,72,5,119,0,0,72,14,1,0,0,0,73,74,5,102,0,0,74,75,5,114,0,0,
        75,76,5,111,0,0,76,77,5,109,0,0,77,16,1,0,0,0,78,79,5,100,0,0,79,
        80,5,97,0,0,80,81,5,116,0,0,81,82,5,97,0,0,82,18,1,0,0,0,83,84,5,
        100,0,0,84,85,5,101,0,0,85,86,5,102,0,0,86,87,5,105,0,0,87,88,5,
        110,0,0,88,89,5,101,0,0,89,20,1,0,0,0,90,91,5,105,0,0,91,92,5,109,
        0,0,92,93,5,112,0,0,93,94,5,108,0,0,94,95,5,101,0,0,95,96,5,109,
        0,0,96,97,5,101,0,0,97,98,5,110,0,0,98,99,5,116,0,0,99,100,5,97,
        0,0,100,101,5,116,0,0,101,102,5,105,0,0,102,103,5,111,0,0,103,104,
        5,110,0,0,104,22,1,0,0,0,105,106,5,112,0,0,106,107,5,97,0,0,107,
        108,5,114,0,0,108,109,5,97,0,0,109,110,5,109,0,0,110,24,1,0,0,0,
        111,112,5,116,0,0,112,113,5,97,0,0,113,114,5,115,0,0,114,115,5,107,
        0,0,115,26,1,0,0,0,116,117,5,99,0,0,117,118,5,111,0,0,118,119,5,
        110,0,0,119,120,5,102,0,0,120,121,5,105,0,0,121,122,5,103,0,0,122,
        123,5,117,0,0,123,124,5,114,0,0,124,125,5,101,0,0,125,28,1,0,0,0,
        126,127,5,105,0,0,127,128,5,110,0,0,128,129,5,112,0,0,129,130,5,
        117,0,0,130,131,5,116,0,0,131,30,1,0,0,0,132,133,5,111,0,0,133,134,
        5,117,0,0,134,135,5,116,0,0,135,136,5,112,0,0,136,137,5,117,0,0,
        137,138,5,116,0,0,138,32,1,0,0,0,139,140,5,83,0,0,140,141,5,84,0,
        0,141,142,5,65,0,0,142,143,5,82,0,0,143,144,5,84,0,0,144,34,1,0,
        0,0,145,146,5,69,0,0,146,147,5,78,0,0,147,148,5,68,0,0,148,36,1,
        0,0,0,149,150,7,0,0,0,150,38,1,0,0,0,151,152,7,1,0,0,152,40,1,0,
        0,0,153,158,3,37,18,0,154,157,3,37,18,0,155,157,3,39,19,0,156,154,
        1,0,0,0,156,155,1,0,0,0,157,160,1,0,0,0,158,156,1,0,0,0,158,159,
        1,0,0,0,159,42,1,0,0,0,160,158,1,0,0,0,161,165,5,34,0,0,162,164,
        8,2,0,0,163,162,1,0,0,0,164,167,1,0,0,0,165,163,1,0,0,0,165,166,
        1,0,0,0,166,168,1,0,0,0,167,165,1,0,0,0,168,169,5,34,0,0,169,44,
        1,0,0,0,170,172,3,39,19,0,171,170,1,0,0,0,172,173,1,0,0,0,173,171,
        1,0,0,0,173,174,1,0,0,0,174,181,1,0,0,0,175,177,5,46,0,0,176,178,
        3,39,19,0,177,176,1,0,0,0,178,179,1,0,0,0,179,177,1,0,0,0,179,180,
        1,0,0,0,180,182,1,0,0,0,181,175,1,0,0,0,181,182,1,0,0,0,182,46,1,
        0,0,0,183,185,7,3,0,0,184,183,1,0,0,0,185,186,1,0,0,0,186,184,1,
        0,0,0,186,187,1,0,0,0,187,188,1,0,0,0,188,189,6,23,0,0,189,48,1,
        0,0,0,190,191,5,47,0,0,191,192,5,47,0,0,192,196,1,0,0,0,193,195,
        8,4,0,0,194,193,1,0,0,0,195,198,1,0,0,0,196,194,1,0,0,0,196,197,
        1,0,0,0,197,199,1,0,0,0,198,196,1,0,0,0,199,200,6,24,0,0,200,50,
        1,0,0,0,9,0,156,158,165,173,179,181,186,196,1,0,1,0
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!XXPLexer.__ATN) {
            XXPLexer.__ATN = new antlr.ATNDeserializer().deserialize(XXPLexer._serializedATN);
        }

        return XXPLexer.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(XXPLexer.literalNames, XXPLexer.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return XXPLexer.vocabulary;
    }

    private static readonly decisionsToDFA = XXPLexer._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}