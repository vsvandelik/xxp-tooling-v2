/**
 * Integration tests for database-based workflow repository server.
 * Tests all endpoints and functionality with actual database operations.
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';

import { DatabaseWorkflowRepositoryServer } from '../src/server/DatabaseWorkflowRepositoryServer.js';

describe('Database Workflow Repository Server Integration Tests', () => {
  let server: DatabaseWorkflowRepositoryServer;
  let testDir: string;
  let dbPath: string;
  let authToken: string;

  // Helper function to get authentication token
  const getAuthToken = async (): Promise<string> => {
    const response = await request(server.getApp())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    return response.body.data.token;
  };

  beforeAll(async () => {
    // Create temporary test directory
    testDir = path.join(__dirname, 'test-data-' + uuidv4());
    await fs.mkdir(testDir, { recursive: true });

    dbPath = path.join(testDir, 'test-workflow-repository.sqlite3');

    // Create server instance
    server = new DatabaseWorkflowRepositoryServer({
      port: 0, // Use random port
      storagePath: testDir,
      jwtSecret: 'test-secret',
      corsOrigin: '*',
      databasePath: dbPath,
    });

    await server.start();
    
    // Get authentication token for tests
    authToken = await getAuthToken();
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
    
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    
    // Give a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(server.getApp()).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.storage).toBe('database');
    });
  });

  describe('Authentication', () => {
    it('should handle login with invalid credentials', async () => {
      const response = await request(server.getApp())
        .post('/auth/login')
        .send({
          username: 'invalid',
          password: 'invalid',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should handle logout', async () => {
      const response = await request(server.getApp()).post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Workflow Operations', () => {
    beforeAll(async () => {
      // For these tests, we'll work without authentication since we don't have a user system set up
      // In a real implementation, you would set up test users
    });

    it('should initially have no workflows', async () => {
      const response = await request(server.getApp())
        .get('/workflows')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workflows).toHaveLength(0);
    });

    it('should initially have no tags', async () => {
      const response = await request(server.getApp())
        .get('/tags')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toHaveLength(0);
    });

    it('should initially have no authors', async () => {
      const response = await request(server.getApp())
        .get('/authors')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.authors).toHaveLength(0);
    });

    it('should return empty tree structure initially', async () => {
      const response = await request(server.getApp())
        .get('/tree')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tree).toEqual([]);
    });

    it('should handle search with no results', async () => {
      const response = await request(server.getApp())
        .get('/search')
        .query({ query: 'nonexistent' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workflows).toHaveLength(0);
    });

    it('should return 404 for non-existent workflow', async () => {
      const response = await request(server.getApp())
        .get('/workflows/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Workflow not found');
    });

    it('should return 404 for non-existent workflow download', async () => {
      const response = await request(server.getApp())
        .get('/workflows/nonexistent-id/content')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Workflow not found');
    });

    it('should require authentication for workflow upload', async () => {
      const response = await request(server.getApp())
        .post('/workflows')
        .attach('workflow', Buffer.from('test'), 'test.zip');

      expect(response.status).toBe(401);
    });

    it('should require authentication for workflow update', async () => {
      const response = await request(server.getApp())
        .put('/workflows/test-id')
        .attach('workflow', Buffer.from('test'), 'test.zip');

      expect(response.status).toBe(401);
    });

    it('should require authentication for workflow deletion', async () => {
      const response = await request(server.getApp()).delete('/workflows/test-id');

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent workflow deletion', async () => {
      const response = await request(server.getApp())
        .delete('/workflows/test-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication for attachment operations', async () => {
      const addResponse = await request(server.getApp())
        .post('/workflows/test-id/attachments')
        .attach('attachments', Buffer.from('test'), 'test.txt');

      expect(addResponse.status).toBe(401);

      const deleteResponse = await request(server.getApp())
        .delete('/workflows/test-id/attachments/test.txt');

      expect(deleteResponse.status).toBe(401);
    });

    it('should require authentication for override confirmation', async () => {
      const response = await request(server.getApp())
        .post('/workflows/confirm-override')
        .send({
          workflowId: 'test-id',
          requestId: 'test-request',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Database Operations', () => {
    it('should create database file', async () => {
      try {
        await fs.access(dbPath);
        expect(true).toBe(true); // Database file exists
      } catch {
        expect(false).toBe(true); // Database file should exist
      }
    });

    it('should handle database queries without errors', async () => {
      // This test ensures the database is properly initialized and can handle queries
      const response = await request(server.getApp())
        .get('/workflows')
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(server.getApp()).get('/unknown-endpoint');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Endpoint not found');
    });

    it('should handle malformed requests', async () => {
      const response = await request(server.getApp())
        .get('/workflows/test-id')
        .send('invalid json')
        .set('Authorization', `Bearer ${authToken}`);

      // Should still work since it's a GET request
      expect(response.status).toBe(404);
    });
  });

  describe('Search and Filtering', () => {
    it('should handle search with various parameters', async () => {
      const queries = [
        { query: 'test' },
        { author: 'testuser' },
        { tags: 'tag1,tag2' },
        { path: 'test/path' },
        { limit: '10' },
        { offset: '5' },
        { query: 'test', author: 'testuser', limit: '5' },
      ];

      for (const query of queries) {
        const response = await request(server.getApp())
          .get('/search')
          .query(query)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.workflows)).toBe(true);
      }
    });

    it('should handle workflow listing with parameters', async () => {
      const queries = [
        { query: 'test' },
        { author: 'testuser' },
        { tags: 'tag1,tag2' },
        { path: 'test/path' },
        { limit: '10' },
        { offset: '5' },
      ];

      for (const query of queries) {
        const response = await request(server.getApp())
          .get('/workflows')
          .query(query)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.workflows)).toBe(true);
      }
    });
  });

  describe('Tree Structure', () => {
    it('should handle tree requests for different paths', async () => {
      const paths = ['', 'test', 'test/path', 'deep/nested/path'];

      for (const path of paths) {
        const url = path ? `/tree/${path}` : '/tree';
        const response = await request(server.getApp())
          .get(url)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.tree).toBeDefined();
      }
    });
  });

  describe('File Operations', () => {
    it('should handle file download requests gracefully', async () => {
      const response = await request(server.getApp())
        .get('/workflows/test-id/files/test.txt')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(501); // Not implemented
    });

    it('should validate workflow ID for file operations', async () => {
      const response = await request(server.getApp())
        .get('/workflows//files/test.txt');

      expect(response.status).toBe(404); // Express routing returns 404 for empty ID
    });

    it('should validate file path for file operations', async () => {
      const response = await request(server.getApp())
        .get('/workflows/test-id/files/')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400); // File path is required
      expect(response.body.error).toBe('File path is required');
    });
  });

  describe('Input Validation', () => {
    it('should validate workflow ID in requests', async () => {
      const endpoints = [
        { method: 'get', path: '/workflows/empty-id' },
        { method: 'get', path: '/workflows/empty-id/content' },
        { method: 'delete', path: '/workflows/empty-id' },
      ];

      for (const endpoint of endpoints) {
        let response;
        
        switch (endpoint.method) {
          case 'get':
            response = await request(server.getApp()).get(endpoint.path).set('Authorization', `Bearer ${authToken}`);
            break;
          case 'delete':
            response = await request(server.getApp()).delete(endpoint.path).set('Authorization', `Bearer ${authToken}`);
            break;
          default:
            throw new Error(`Unsupported method: ${endpoint.method}`);
        }
        
        // Should return 404 for non-existent workflows
        expect(response.status).toBe(404);
      }
    });

    it('should handle missing request body for override confirmation', async () => {
      const response = await request(server.getApp())
        .post('/workflows/confirm-override')
        .send({});

      expect(response.status).toBe(401); // Auth required first
    });
  });

  describe('Content Types', () => {
    it('should handle different content types', async () => {
      const response = await request(server.getApp())
        .get('/workflows')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should handle CORS headers', async () => {
      const response = await request(server.getApp())
        .options('/workflows')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(server.getApp()).get('/workflows').set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle concurrent metadata requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(server.getApp()).get('/tags').set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});