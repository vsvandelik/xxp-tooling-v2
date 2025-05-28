import { describe, it, expect } from '@jest/globals';
import { workflowNameToFileName } from '../src/utils/naming';

describe('naming utilities', () => {
  describe('workflowNameToFileName', () => {
    it('should convert workflow name to file name with .xxp extension', () => {
      expect(workflowNameToFileName('MyBestWorkflow')).toBe('myBestWorkflow.xxp');
    });

    it('should handle single character names', () => {
      expect(workflowNameToFileName('A')).toBe('a.xxp');
    });

    it('should handle names with numbers', () => {
      expect(workflowNameToFileName('A2')).toBe('a2.xxp');
    });

    it('should preserve camelCase after first character', () => {
      expect(workflowNameToFileName('WorkflowName')).toBe('workflowName.xxp');
    });

    it('should handle complex camelCase names', () => {
      expect(workflowNameToFileName('MyComplexWorkflowName')).toBe('myComplexWorkflowName.xxp');
    });

    it('should handle names starting with lowercase', () => {
      expect(workflowNameToFileName('workflowName')).toBe('workflowName.xxp');
    });

    it('should handle names with multiple uppercase letters', () => {
      expect(workflowNameToFileName('XMLHttpRequest')).toBe('xMLHttpRequest.xxp');
    });

    it('should throw error for empty string', () => {
      expect(() => workflowNameToFileName('')).toThrow('Name cannot be empty');
    });

    it('should throw error for null or undefined', () => {
      expect(() => workflowNameToFileName(null as any)).toThrow('Name cannot be empty');
      expect(() => workflowNameToFileName(undefined as any)).toThrow('Name cannot be empty');
    });

    it('should handle names with special characters after first letter', () => {
      expect(workflowNameToFileName('Workflow_Name')).toBe('workflow_Name.xxp');
      expect(workflowNameToFileName('Workflow123')).toBe('workflow123.xxp');
    });

    it('should handle very long names', () => {
      const longName = 'VeryLongWorkflowNameThatShouldStillWorkCorrectly';
      expect(workflowNameToFileName(longName)).toBe('veryLongWorkflowNameThatShouldStillWorkCorrectly.xxp');
    });
  });
});
