grammar ESPACE;

// Parser Rules
program: experimentDeclaration;

experimentDeclaration: experimentHeader experimentBody;
experimentHeader: EXPERIMENT IDENTIFIER;
experimentBody: LBRACE experimentContent* RBRACE;
experimentContent:
    spaceDeclaration
    | controlBlock
    | dataDefinition;

// Space declaration
spaceDeclaration: spaceHeader spaceBody;
spaceHeader: SPACE IDENTIFIER OF workflowNameRead;
spaceBody: LBRACE spaceContent* RBRACE;
spaceContent:
    strategyStatement
    | paramDefinition
    | taskConfiguration
    | dataDefinition;

strategyStatement: STRATEGY IDENTIFIER SEMICOLON;
paramDefinition: PARAM IDENTIFIER EQUALS paramValue SEMICOLON;

paramValue:
    enumFunction
    | rangeFunction
    | expression;

enumFunction: ENUM LPAREN expression (COMMA expression)* RPAREN;
rangeFunction: RANGE LPAREN NUMBER COMMA NUMBER COMMA NUMBER RPAREN;

// Task configuration (similar to XXP)
taskConfiguration: taskConfigurationHeader taskConfigurationBody;
taskConfigurationHeader: CONFIGURE TASK taskNameRead;
taskConfigurationBody: LBRACE configurationContent* RBRACE;
configurationContent: paramAssignment;
paramAssignment: PARAM IDENTIFIER EQUALS paramValue SEMICOLON;

// Control block
controlBlock: CONTROL controlBody;
controlBody: LBRACE controlContent* RBRACE;
controlContent: 
    simpleTransition
    | conditionalTransition;

simpleTransition: spaceNameRead (ARROW spaceNameRead)+ SEMICOLON;
conditionalTransition: conditionalTransitionHeader conditionalTransitionBody;
conditionalTransitionHeader: spaceNameRead CONDITION_ARROW spaceNameRead;
conditionalTransitionBody: LBRACE condition* RBRACE;
condition: CONDITION STRING SEMICOLON;

// Data definition - Available at both experiment and space levels
dataDefinition: DEFINE DATA IDENTIFIER EQUALS STRING SEMICOLON;

// Variables read rules
workflowNameRead: IDENTIFIER;
taskNameRead: IDENTIFIER;
spaceNameRead: IDENTIFIER;

// Expressions
expression: NUMBER | STRING | BOOLEAN;

// Symbols
SEMICOLON: ';';
ARROW: '->';
CONDITION_ARROW: '-?>';
LBRACE: '{';
RBRACE: '}';
LPAREN: '(';
RPAREN: ')';
EQUALS: '=';
COMMA: ',';

// Keywords
EXPERIMENT: 'experiment';
SPACE: 'space';
OF: 'of';
STRATEGY: 'strategy';
PARAM: 'param';
ENUM: 'enum';
RANGE: 'range';
CONFIGURE: 'configure';
TASK: 'task';
CONTROL: 'control';
CONDITION: 'condition';
DEFINE: 'define';
DATA: 'data';

// Fragments
fragment LETTER: [a-zA-Z_];
fragment DIGIT: [0-9];

// Lexer Rules
BOOLEAN: 'true' | 'false';
IDENTIFIER: LETTER (LETTER | DIGIT)*;
STRING: '"' ~["]* '"';
NUMBER: DIGIT+ ('.' DIGIT+)?;

// Ignored tokens
WS: [ \t\r\n]+ -> channel(HIDDEN);
COMMENT: '//' ~[\r\n]* -> channel(HIDDEN);