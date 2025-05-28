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
});
