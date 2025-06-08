import { describe, it, expect } from '@jest/globals';
import { ArtifactGenerator } from '../src/generators/ArtifactGenerator';

describe('ArtifactGenerator', () => {
  describe('constructor', () => {
    it('should create an instance with default options', () => {
      const generator = new ArtifactGenerator({});
      expect(generator).toBeInstanceOf(ArtifactGenerator);
    });

    it('should create an instance with verbose option', () => {
      const generator = new ArtifactGenerator({ verbose: true });
      expect(generator).toBeInstanceOf(ArtifactGenerator);
    });

    it('should create an instance with workflow directory option', () => {
      const generator = new ArtifactGenerator({ 
        workflowDirectory: '/path/to/workflows' 
      });
      expect(generator).toBeInstanceOf(ArtifactGenerator);
    });
  });

  describe('validation', () => {
    it('should handle non-existent files gracefully', async () => {
      const generator = new ArtifactGenerator({});
      
      const result = await generator.validate('non-existent-file.espace');
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('ENOENT');
    });
  });

  describe('XXP boolean support', () => {
    it('should parse boolean values in XXP workflow param assignments', () => {
      const { WorkflowModelVisitor } = require('../src/visitors/WorkflowModelVisitor');
      const { CharStream, CommonTokenStream } = require('antlr4ng');
      const { XXPLexer, XXPParser } = require('@extremexp/core');
      
      const workflowContent = `workflow TestWorkflow {
  configure task TestTask {
    param enableFeature = true;
    param disableOption = false;
    param textParam = "test";
    param numberParam = 42;
  }
}`;
      
      const inputStream = CharStream.fromString(workflowContent);
      const lexer = new XXPLexer(inputStream);
      const tokenStream = new CommonTokenStream(lexer);
      const parser = new XXPParser(tokenStream);
      
      const tree = parser.program();
      const visitor = new WorkflowModelVisitor();
      const result = visitor.visit(tree);
      
      expect(result.name).toBe('TestWorkflow');
      expect(result.taskConfigurations).toHaveLength(1);
      
      const taskConfig = result.taskConfigurations[0];
      expect(taskConfig.name).toBe('TestTask');
      expect(taskConfig.parameters).toHaveLength(4);
      
      const enableFeature = taskConfig.parameters.find((p: any) => p.name === 'enableFeature');
      expect(enableFeature?.value).toBe(true);
      
      const disableOption = taskConfig.parameters.find((p: any) => p.name === 'disableOption');
      expect(disableOption?.value).toBe(false);
      
      const textParam = taskConfig.parameters.find((p: any) => p.name === 'textParam');
      expect(textParam?.value).toBe('test');
      
      const numberParam = taskConfig.parameters.find((p: any) => p.name === 'numberParam');
      expect(numberParam?.value).toBe(42);
    });
  });
});
