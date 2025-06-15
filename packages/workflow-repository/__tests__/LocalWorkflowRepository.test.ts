import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LocalWorkflowRepository } from '../src/repositories/LocalWorkflowRepository.js';

describe('LocalWorkflowRepository', () => {
  let repository: LocalWorkflowRepository;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp('test-repo-');
    repository = new LocalWorkflowRepository(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('version support removal', () => {
    it('should no longer include version in workflow metadata', async () => {
      const workflowContent = {
        mainFile: '// @name Test Workflow\nprint("hello")',
        attachments: new Map<string, Buffer>(),
      };

      const metadata = await repository.upload('test', workflowContent, {
        name: 'Test Workflow',
        description: 'A test workflow',
        author: 'Test Author',
        tags: ['test'],
        path: 'test',
        mainFile: 'main.xxp',
      });

      expect(metadata).not.toHaveProperty('version');

      // Verify the workflow can be retrieved without version
      const retrieved = await repository.get(metadata.id);
      expect(retrieved?.metadata).not.toHaveProperty('version');
    });

    it('should no longer extract version from file comments', async () => {
      const workflowContent = '// @name Test\n// @version 1.2.3\nprint("test")';
      const filePath = path.join(tempDir, 'test.xxp');
      await fs.writeFile(filePath, workflowContent);

      const workflows = await repository.list();
      expect(workflows).toHaveLength(1);
      expect(workflows[0]).not.toHaveProperty('version');
    });

    it('should work without any version-related metadata', async () => {
      const workflowContent = '// @name Test\nprint("test")';
      const filePath = path.join(tempDir, 'test.xxp');
      await fs.writeFile(filePath, workflowContent);

      const workflows = await repository.list();
      expect(workflows).toHaveLength(1);
      expect(workflows[0]).not.toHaveProperty('version');
      expect(workflows[0]?.name).toBe('Test');
    });
  });
});