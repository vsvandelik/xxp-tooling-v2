// Generated from src/language/grammar/ESPACE.g4 by ANTLR 4.13.1

import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";


export class ESPACELexer extends antlr.Lexer {
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

    public static readonly channelNames = [
        "DEFAULT_TOKEN_CHANNEL", "HIDDEN"
    ];

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

    public static readonly modeNames = [
        "DEFAULT_MODE",
    ];

    public static readonly ruleNames = [
        "SEMICOLON", "ARROW", "CONDITION_ARROW", "LBRACE", "RBRACE", "LPAREN", 
        "RPAREN", "EQUALS", "COMMA", "EXPERIMENT", "SPACE", "OF", "STRATEGY", 
        "PARAM", "ENUM", "RANGE", "CONFIGURE", "TASK", "CONTROL", "CONDITION", 
        "DEFINE", "DATA", "LETTER", "DIGIT", "IDENTIFIER", "STRING", "NUMBER", 
        "WS", "COMMENT",
    ];


    public constructor(input: antlr.CharStream) {
        super(input);
        this.interpreter = new antlr.LexerATNSimulator(this, ESPACELexer._ATN, ESPACELexer.decisionsToDFA, new antlr.PredictionContextCache());
    }

    public get grammarFileName(): string { return "ESPACE.g4"; }

    public get literalNames(): (string | null)[] { return ESPACELexer.literalNames; }
    public get symbolicNames(): (string | null)[] { return ESPACELexer.symbolicNames; }
    public get ruleNames(): string[] { return ESPACELexer.ruleNames; }

    public get serializedATN(): number[] { return ESPACELexer._serializedATN; }

    public get channelNames(): string[] { return ESPACELexer.channelNames; }

    public get modeNames(): string[] { return ESPACELexer.modeNames; }

    public static readonly _serializedATN: number[] = [
        4,0,27,223,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,
        2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,
        13,7,13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,
        19,2,20,7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,
        26,7,26,2,27,7,27,2,28,7,28,1,0,1,0,1,1,1,1,1,1,1,2,1,2,1,2,1,2,
        1,3,1,3,1,4,1,4,1,5,1,5,1,6,1,6,1,7,1,7,1,8,1,8,1,9,1,9,1,9,1,9,
        1,9,1,9,1,9,1,9,1,9,1,9,1,9,1,10,1,10,1,10,1,10,1,10,1,10,1,11,1,
        11,1,11,1,12,1,12,1,12,1,12,1,12,1,12,1,12,1,12,1,12,1,13,1,13,1,
        13,1,13,1,13,1,13,1,14,1,14,1,14,1,14,1,14,1,15,1,15,1,15,1,15,1,
        15,1,15,1,16,1,16,1,16,1,16,1,16,1,16,1,16,1,16,1,16,1,16,1,17,1,
        17,1,17,1,17,1,17,1,18,1,18,1,18,1,18,1,18,1,18,1,18,1,18,1,19,1,
        19,1,19,1,19,1,19,1,19,1,19,1,19,1,19,1,19,1,20,1,20,1,20,1,20,1,
        20,1,20,1,20,1,21,1,21,1,21,1,21,1,21,1,22,1,22,1,23,1,23,1,24,1,
        24,1,24,5,24,179,8,24,10,24,12,24,182,9,24,1,25,1,25,5,25,186,8,
        25,10,25,12,25,189,9,25,1,25,1,25,1,26,4,26,194,8,26,11,26,12,26,
        195,1,26,1,26,4,26,200,8,26,11,26,12,26,201,3,26,204,8,26,1,27,4,
        27,207,8,27,11,27,12,27,208,1,27,1,27,1,28,1,28,1,28,1,28,5,28,217,
        8,28,10,28,12,28,220,9,28,1,28,1,28,0,0,29,1,1,3,2,5,3,7,4,9,5,11,
        6,13,7,15,8,17,9,19,10,21,11,23,12,25,13,27,14,29,15,31,16,33,17,
        35,18,37,19,39,20,41,21,43,22,45,0,47,0,49,23,51,24,53,25,55,26,
        57,27,1,0,5,3,0,65,90,95,95,97,122,1,0,48,57,1,0,34,34,3,0,9,10,
        13,13,32,32,2,0,10,10,13,13,228,0,1,1,0,0,0,0,3,1,0,0,0,0,5,1,0,
        0,0,0,7,1,0,0,0,0,9,1,0,0,0,0,11,1,0,0,0,0,13,1,0,0,0,0,15,1,0,0,
        0,0,17,1,0,0,0,0,19,1,0,0,0,0,21,1,0,0,0,0,23,1,0,0,0,0,25,1,0,0,
        0,0,27,1,0,0,0,0,29,1,0,0,0,0,31,1,0,0,0,0,33,1,0,0,0,0,35,1,0,0,
        0,0,37,1,0,0,0,0,39,1,0,0,0,0,41,1,0,0,0,0,43,1,0,0,0,0,49,1,0,0,
        0,0,51,1,0,0,0,0,53,1,0,0,0,0,55,1,0,0,0,0,57,1,0,0,0,1,59,1,0,0,
        0,3,61,1,0,0,0,5,64,1,0,0,0,7,68,1,0,0,0,9,70,1,0,0,0,11,72,1,0,
        0,0,13,74,1,0,0,0,15,76,1,0,0,0,17,78,1,0,0,0,19,80,1,0,0,0,21,91,
        1,0,0,0,23,97,1,0,0,0,25,100,1,0,0,0,27,109,1,0,0,0,29,115,1,0,0,
        0,31,120,1,0,0,0,33,126,1,0,0,0,35,136,1,0,0,0,37,141,1,0,0,0,39,
        149,1,0,0,0,41,159,1,0,0,0,43,166,1,0,0,0,45,171,1,0,0,0,47,173,
        1,0,0,0,49,175,1,0,0,0,51,183,1,0,0,0,53,193,1,0,0,0,55,206,1,0,
        0,0,57,212,1,0,0,0,59,60,5,59,0,0,60,2,1,0,0,0,61,62,5,45,0,0,62,
        63,5,62,0,0,63,4,1,0,0,0,64,65,5,45,0,0,65,66,5,63,0,0,66,67,5,62,
        0,0,67,6,1,0,0,0,68,69,5,123,0,0,69,8,1,0,0,0,70,71,5,125,0,0,71,
        10,1,0,0,0,72,73,5,40,0,0,73,12,1,0,0,0,74,75,5,41,0,0,75,14,1,0,
        0,0,76,77,5,61,0,0,77,16,1,0,0,0,78,79,5,44,0,0,79,18,1,0,0,0,80,
        81,5,101,0,0,81,82,5,120,0,0,82,83,5,112,0,0,83,84,5,101,0,0,84,
        85,5,114,0,0,85,86,5,105,0,0,86,87,5,109,0,0,87,88,5,101,0,0,88,
        89,5,110,0,0,89,90,5,116,0,0,90,20,1,0,0,0,91,92,5,115,0,0,92,93,
        5,112,0,0,93,94,5,97,0,0,94,95,5,99,0,0,95,96,5,101,0,0,96,22,1,
        0,0,0,97,98,5,111,0,0,98,99,5,102,0,0,99,24,1,0,0,0,100,101,5,115,
        0,0,101,102,5,116,0,0,102,103,5,114,0,0,103,104,5,97,0,0,104,105,
        5,116,0,0,105,106,5,101,0,0,106,107,5,103,0,0,107,108,5,121,0,0,
        108,26,1,0,0,0,109,110,5,112,0,0,110,111,5,97,0,0,111,112,5,114,
        0,0,112,113,5,97,0,0,113,114,5,109,0,0,114,28,1,0,0,0,115,116,5,
        101,0,0,116,117,5,110,0,0,117,118,5,117,0,0,118,119,5,109,0,0,119,
        30,1,0,0,0,120,121,5,114,0,0,121,122,5,97,0,0,122,123,5,110,0,0,
        123,124,5,103,0,0,124,125,5,101,0,0,125,32,1,0,0,0,126,127,5,99,
        0,0,127,128,5,111,0,0,128,129,5,110,0,0,129,130,5,102,0,0,130,131,
        5,105,0,0,131,132,5,103,0,0,132,133,5,117,0,0,133,134,5,114,0,0,
        134,135,5,101,0,0,135,34,1,0,0,0,136,137,5,116,0,0,137,138,5,97,
        0,0,138,139,5,115,0,0,139,140,5,107,0,0,140,36,1,0,0,0,141,142,5,
        99,0,0,142,143,5,111,0,0,143,144,5,110,0,0,144,145,5,116,0,0,145,
        146,5,114,0,0,146,147,5,111,0,0,147,148,5,108,0,0,148,38,1,0,0,0,
        149,150,5,99,0,0,150,151,5,111,0,0,151,152,5,110,0,0,152,153,5,100,
        0,0,153,154,5,105,0,0,154,155,5,116,0,0,155,156,5,105,0,0,156,157,
        5,111,0,0,157,158,5,110,0,0,158,40,1,0,0,0,159,160,5,100,0,0,160,
        161,5,101,0,0,161,162,5,102,0,0,162,163,5,105,0,0,163,164,5,110,
        0,0,164,165,5,101,0,0,165,42,1,0,0,0,166,167,5,100,0,0,167,168,5,
        97,0,0,168,169,5,116,0,0,169,170,5,97,0,0,170,44,1,0,0,0,171,172,
        7,0,0,0,172,46,1,0,0,0,173,174,7,1,0,0,174,48,1,0,0,0,175,180,3,
        45,22,0,176,179,3,45,22,0,177,179,3,47,23,0,178,176,1,0,0,0,178,
        177,1,0,0,0,179,182,1,0,0,0,180,178,1,0,0,0,180,181,1,0,0,0,181,
        50,1,0,0,0,182,180,1,0,0,0,183,187,5,34,0,0,184,186,8,2,0,0,185,
        184,1,0,0,0,186,189,1,0,0,0,187,185,1,0,0,0,187,188,1,0,0,0,188,
        190,1,0,0,0,189,187,1,0,0,0,190,191,5,34,0,0,191,52,1,0,0,0,192,
        194,3,47,23,0,193,192,1,0,0,0,194,195,1,0,0,0,195,193,1,0,0,0,195,
        196,1,0,0,0,196,203,1,0,0,0,197,199,5,46,0,0,198,200,3,47,23,0,199,
        198,1,0,0,0,200,201,1,0,0,0,201,199,1,0,0,0,201,202,1,0,0,0,202,
        204,1,0,0,0,203,197,1,0,0,0,203,204,1,0,0,0,204,54,1,0,0,0,205,207,
        7,3,0,0,206,205,1,0,0,0,207,208,1,0,0,0,208,206,1,0,0,0,208,209,
        1,0,0,0,209,210,1,0,0,0,210,211,6,27,0,0,211,56,1,0,0,0,212,213,
        5,47,0,0,213,214,5,47,0,0,214,218,1,0,0,0,215,217,8,4,0,0,216,215,
        1,0,0,0,217,220,1,0,0,0,218,216,1,0,0,0,218,219,1,0,0,0,219,221,
        1,0,0,0,220,218,1,0,0,0,221,222,6,28,0,0,222,58,1,0,0,0,9,0,178,
        180,187,195,201,203,208,218,1,0,1,0
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!ESPACELexer.__ATN) {
            ESPACELexer.__ATN = new antlr.ATNDeserializer().deserialize(ESPACELexer._serializedATN);
        }

        return ESPACELexer.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(ESPACELexer.literalNames, ESPACELexer.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return ESPACELexer.vocabulary;
    }

    private static readonly decisionsToDFA = ESPACELexer._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}