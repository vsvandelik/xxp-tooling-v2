grammar XXP;

// Parser Rules
program: workflowDeclaration;

workflowDeclaration: workflowHeader workflowBody;
workflowHeader: WORKFLOW IDENTIFIER (FROM workflowNameRead)?;
workflowBody: LBRACE workflowContent* RBRACE;
workflowContent:
    dataDefinition
    | taskDefinition
    | taskChain
    | taskConfiguration;

// Data
dataDefinition: DEFINE DATA IDENTIFIER SEMICOLON;

// Tasks
taskDefinition: DEFINE TASK IDENTIFIER SEMICOLON;

taskChain: chainElement (ARROW chainElement)+ SEMICOLON;
chainElement: START | END | taskNameRead;

// Task configuration
taskConfiguration:
    taskConfigurationHeader taskConfigurationBody;
taskConfigurationHeader: CONFIGURE TASK taskNameRead;
taskConfigurationBody: LBRACE configurationContent* RBRACE;

configurationContent: 
    implementation 
    | paramAssignment
    | inputStatement
    | outputStatement;

implementation: IMPLEMENTATION STRING SEMICOLON;
paramAssignment: PARAM IDENTIFIER (EQUALS expression)? SEMICOLON;
inputStatement: INPUT dataNameList SEMICOLON;
outputStatement: OUTPUT dataNameList SEMICOLON;

dataNameList: dataNameRead (COMMA dataNameRead)*;

// Variables read rules
workflowNameRead: IDENTIFIER;
dataNameRead: IDENTIFIER;
taskNameRead: IDENTIFIER;

// Expressions
expression: NUMBER | STRING;

// Symbols
SEMICOLON: ';';
ARROW: '->';
LBRACE: '{';
RBRACE: '}';
EQUALS: '=';
COMMA: ',';

// Keywords
WORKFLOW: 'workflow';
FROM: 'from';
DATA: 'data';
DEFINE: 'define';
IMPLEMENTATION: 'implementation';
PARAM: 'param';
TASK: 'task';
CONFIGURE: 'configure';
INPUT: 'input';
OUTPUT: 'output';
START: 'START';
END: 'END';

// Fragments
fragment LETTER: [a-zA-Z_];
fragment DIGIT: [0-9];

// Lexer Rules
IDENTIFIER: LETTER (LETTER | DIGIT)*;
STRING: '"' ~["]* '"';
NUMBER: DIGIT+ ('.' DIGIT+)?;

// Ignored tokens
WS: [ \t\r\n]+ -> channel(HIDDEN);
COMMENT: '//' ~[\r\n]* -> channel(HIDDEN);