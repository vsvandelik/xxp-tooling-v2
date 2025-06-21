import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WorkflowRepositoryServer, ServerConfig } from '../src/server/WorkflowRepositoryServer.js';

// Simple integration-style test focusing on the core class behavior
describe('WorkflowRepositoryServer', () => {
  const testConfig: ServerConfig = {
    port: 3000,
    storagePath: '/tmp/test-storage',
    jwtSecret: 'test-secret',
    corsOrigin: 'http://localhost:3000'
  };

  describe('constructor', () => {
    it('should create server instance with valid config', () => {
      const server = new WorkflowRepositoryServer(testConfig);
      expect(server).toBeInstanceOf(WorkflowRepositoryServer);
    });

    it('should create server instance without corsOrigin', () => {
      const configWithoutCors: ServerConfig = {
        port: 3000,
        storagePath: '/tmp/test-storage',
        jwtSecret: 'test-secret'
      };
      
      const server = new WorkflowRepositoryServer(configWithoutCors);
      expect(server).toBeInstanceOf(WorkflowRepositoryServer);
    });
  });

  describe('getApp', () => {
    it('should return express application instance', () => {
      const server = new WorkflowRepositoryServer(testConfig);
      const app = server.getApp();
      
      expect(app).toBeDefined();
      expect(typeof app.use).toBe('function');
      expect(typeof app.get).toBe('function');
      expect(typeof app.post).toBe('function');
    });
  });

  describe('configuration validation', () => {
    it('should accept valid port numbers', () => {
      const configs = [
        { ...testConfig, port: 80 },
        { ...testConfig, port: 8080 },
        { ...testConfig, port: 65535 }
      ];

      configs.forEach(config => {
        expect(() => new WorkflowRepositoryServer(config)).not.toThrow();
      });
    });

    it('should accept different storage paths', () => {
      const configs = [
        { ...testConfig, storagePath: '/tmp/workflows' },
        { ...testConfig, storagePath: './local-storage' },
        { ...testConfig, storagePath: '/var/lib/workflows' }
      ];

      configs.forEach(config => {
        expect(() => new WorkflowRepositoryServer(config)).not.toThrow();
      });
    });

    it('should accept different JWT secrets', () => {
      const configs = [
        { ...testConfig, jwtSecret: 'short' },
        { ...testConfig, jwtSecret: 'a'.repeat(256) },
        { ...testConfig, jwtSecret: 'special-chars-123!@#' }
      ];

      configs.forEach(config => {
        expect(() => new WorkflowRepositoryServer(config)).not.toThrow();
      });
    });
  });
});