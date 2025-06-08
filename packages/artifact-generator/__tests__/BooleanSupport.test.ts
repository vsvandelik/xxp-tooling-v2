import { describe, it, expect } from '@jest/globals';
import { ExperimentModelVisitor } from '../src/visitors/ExperimentModelVisitor';
import { CharStream, CommonTokenStream } from 'antlr4ng';
import { ESPACELexer, ESPACEParser } from '@extremexp/core';
import { ParameterDefinition } from '../src/models/ExperimentModel';

describe('Boolean Support', () => {
  it('should parse boolean values in param assignments', () => {
    const espaceContent = `
experiment TestExp {
  space TestSpace of TestWorkflow {
    param boolParam = true;
    param falseBoolParam = false;
  }
}
`;

    const inputStream = CharStream.fromString(espaceContent);
    const lexer = new ESPACELexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new ESPACEParser(tokenStream);
    
    const tree = parser.program();
    const visitor = new ExperimentModelVisitor();
    const result = visitor.visit(tree);
    
    expect(result.name).toBe('TestExp');
    expect(result.spaces).toHaveLength(1);
    expect(result.spaces[0].parameters).toHaveLength(2);
    
    const boolParam = result.spaces[0].parameters.find((p: ParameterDefinition) => p.name === 'boolParam');
    expect(boolParam).toBeDefined();
    expect(boolParam?.type).toBe('value');
    expect(boolParam?.values).toEqual([true]);
    
    const falseBoolParam = result.spaces[0].parameters.find((p: ParameterDefinition) => p.name === 'falseBoolParam');
    expect(falseBoolParam).toBeDefined();
    expect(falseBoolParam?.type).toBe('value');
    expect(falseBoolParam?.values).toEqual([false]);
  });

  it('should parse boolean values in enum functions', () => {
    const espaceContent = `
experiment TestExp {
  space TestSpace of TestWorkflow {
    param mixedEnum = enum(true, false, "test", 42);
  }
}
`;

    const inputStream = CharStream.fromString(espaceContent);
    const lexer = new ESPACELexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new ESPACEParser(tokenStream);
    
    const tree = parser.program();
    const visitor = new ExperimentModelVisitor();
    const result = visitor.visit(tree);
    
    expect(result.spaces[0].parameters).toHaveLength(1);
    
    const enumParam = result.spaces[0].parameters[0];
    expect(enumParam.name).toBe('mixedEnum');
    expect(enumParam.type).toBe('enum');
    expect(enumParam.values).toEqual([true, false, 'test', 42]);
  });

  it('should parse boolean values in task configuration', () => {
    const espaceContent = `
experiment TestExp {
  space TestSpace of TestWorkflow {
    configure task TestTask {
      param enableFeature = true;
      param disableOption = false;
    }
  }
}
`;

    const inputStream = CharStream.fromString(espaceContent);
    const lexer = new ESPACELexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new ESPACEParser(tokenStream);
    
    const tree = parser.program();
    const visitor = new ExperimentModelVisitor();
    const result = visitor.visit(tree);
    
    expect(result.spaces[0].taskConfigurations).toHaveLength(1);
    
    const taskConfig = result.spaces[0].taskConfigurations[0];
    expect(taskConfig.taskName).toBe('TestTask');
    expect(taskConfig.parameters).toHaveLength(2);
    
    const enableFeature = taskConfig.parameters.find((p: ParameterDefinition) => p.name === 'enableFeature');
    expect(enableFeature?.type).toBe('value');
    expect(enableFeature?.values).toEqual([true]);
    
    const disableOption = taskConfig.parameters.find((p: ParameterDefinition) => p.name === 'disableOption');
    expect(disableOption?.type).toBe('value');
    expect(disableOption?.values).toEqual([false]);
  });
});