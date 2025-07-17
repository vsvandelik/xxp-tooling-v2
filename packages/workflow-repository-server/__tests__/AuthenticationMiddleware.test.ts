import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { AuthenticationMiddleware } from '../src/middleware/AuthenticationMiddleware.js';
import { UserService } from '../src/services/UserService.js';
import { User } from '@extremexp/workflow-repository';

// Mock UserService
jest.mock('../src/services/UserService.js');
const MockedUserService = UserService as jest.MockedClass<typeof UserService>;

describe('AuthenticationMiddleware', () => {
  let authMiddleware: AuthenticationMiddleware;
  let mockUserService: jest.Mocked<UserService>;
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserService = {
      verifyToken: jest.fn(),
      canAccess: jest.fn()
    } as any;

    MockedUserService.mockImplementation(() => mockUserService);
    authMiddleware = new AuthenticationMiddleware(mockUserService);

    mockRequest = {
      headers: {},
      params: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn() as any;
  });

  describe('authenticate', () => {
    it('should proceed without setting user if no auth header', () => {
      mockRequest.headers = {};

      authMiddleware.authenticate(mockRequest, mockResponse, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockUserService.verifyToken).not.toHaveBeenCalled();
    });

    it('should proceed without setting user if auth header does not start with Bearer', () => {
      mockRequest.headers = { authorization: 'Basic username:password' };

      authMiddleware.authenticate(mockRequest, mockResponse, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockUserService.verifyToken).not.toHaveBeenCalled();
    });

    it('should set user if valid token provided', () => {
      const testUser: User = {
        id: 'test-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date()
      };

      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockUserService.verifyToken.mockReturnValue(testUser);

      authMiddleware.authenticate(mockRequest, mockResponse, mockNext);

      expect(mockRequest.user).toBe(testUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockUserService.verifyToken).toHaveBeenCalledWith('valid-token');
    });

    it('should not set user if invalid token provided', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      mockUserService.verifyToken.mockReturnValue(null);

      authMiddleware.authenticate(mockRequest, mockResponse, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockUserService.verifyToken).toHaveBeenCalledWith('invalid-token');
    });
  });

  describe('requireAuth', () => {
    it('should proceed if user is authenticated', () => {
      const testUser: User = {
        id: 'test-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date()
      };

      mockRequest.user = testUser;

      authMiddleware.requireAuth(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', () => {
      delete mockRequest.user;

      authMiddleware.requireAuth(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should proceed if user is admin', () => {
      const adminUser: User = {
        id: 'admin-id',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date()
      };

      mockRequest.user = adminUser;

      authMiddleware.requireAdmin(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should proceed if user is authenticated (simplified model)', () => {
      const regularUser: User = {
        id: 'user-id',
        username: 'user',
        email: 'user@example.com',
        role: 'user',
        createdAt: new Date()
      };

      mockRequest.user = regularUser;

      authMiddleware.requireAdmin(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', () => {
      delete mockRequest.user;

      authMiddleware.requireAdmin(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

});