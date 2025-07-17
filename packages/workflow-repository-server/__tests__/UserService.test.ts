import { describe, it, expect, beforeEach } from '@jest/globals';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserService } from '../src/services/UserService.js';
import { CreateUserRequest, UserCredentials } from '@extremexp/workflow-repository';

// Mock bcrypt and jwt modules
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('UserService', () => {
  let userService: UserService;
  const testJwtSecret = 'test-secret';

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService(testJwtSecret);
    
    // Setup default mock implementations
    mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);
    mockedBcrypt.hashSync.mockReturnValue('hashed-admin-password' as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);
    mockedJwt.sign.mockReturnValue('mock-token' as never);
    mockedJwt.verify.mockReturnValue({
      userId: 'user-id',
      username: 'testuser',
      role: 'user'
    } as never);
  });

  describe('constructor', () => {
    it('should initialize with admin user', () => {
      const users = userService.listUsers();
      const adminUser = users.find(u => u.username === 'admin');
      
      expect(adminUser).toBeDefined();
      expect(adminUser?.role).toBe('admin');
      expect(adminUser?.email).toBe('admin@example.com');
      expect(mockedBcrypt.hashSync).toHaveBeenCalledWith('admin123', 10);
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const createRequest: CreateUserRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };

      const user = await userService.createUser(createRequest);

      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('user');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user).not.toHaveProperty('passwordHash');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should default role to user if not specified', async () => {
      const createRequest: CreateUserRequest = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123'
      };

      const user = await userService.createUser(createRequest);

      expect(user.role).toBe('user');
    });

    it('should throw error if username already exists', async () => {
      const createRequest: CreateUserRequest = {
        username: 'admin',
        email: 'admin2@example.com',
        password: 'password123'
      };

      await expect(userService.createUser(createRequest)).rejects.toThrow('Username already exists');
    });
  });

  describe('authenticate', () => {
    beforeEach(async () => {
      const createRequest: CreateUserRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };
      await userService.createUser(createRequest);
    });

    it('should authenticate user with valid credentials', async () => {
      const credentials: UserCredentials = {
        username: 'testuser',
        password: 'password123'
      };

      const authToken = await userService.authenticate(credentials);

      expect(authToken).toBeDefined();
      expect(authToken?.token).toBe('mock-token');
      expect(authToken?.user.username).toBe('testuser');
      expect(authToken?.user).not.toHaveProperty('passwordHash');
      expect(authToken?.expiresAt).toBeInstanceOf(Date);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: expect.any(String), username: 'testuser', role: 'user' },
        testJwtSecret,
        { expiresIn: '7d' }
      );
    });

    it('should return null for non-existent user', async () => {
      const credentials: UserCredentials = {
        username: 'nonexistent',
        password: 'password123'
      };

      const authToken = await userService.authenticate(credentials);

      expect(authToken).toBeNull();
    });

    it('should return null for invalid password', async () => {
      mockedBcrypt.compare.mockResolvedValue(false as never);
      
      const credentials: UserCredentials = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const authToken = await userService.authenticate(credentials);

      expect(authToken).toBeNull();
    });

    it('should update lastLogin on successful authentication', async () => {
      const credentials: UserCredentials = {
        username: 'testuser',
        password: 'password123'
      };

      const authToken = await userService.authenticate(credentials);
      
      expect(authToken?.user.lastLogin).toBeInstanceOf(Date);
    });
  });

  describe('verifyToken', () => {
    beforeEach(async () => {
      const createRequest: CreateUserRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };
      await userService.createUser(createRequest);
    });

    it('should verify valid token', () => {
      const user = userService.verifyToken('valid-token');

      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
      expect(user).not.toHaveProperty('passwordHash');
      expect(mockedJwt.verify).toHaveBeenCalledWith('valid-token', testJwtSecret);
    });

    it('should return null for invalid token', () => {
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const user = userService.verifyToken('invalid-token');

      expect(user).toBeNull();
    });

    it('should return null if user no longer exists', () => {
      mockedJwt.verify.mockReturnValue({
        userId: 'user-id',
        username: 'nonexistent',
        role: 'user'
      } as never);

      const user = userService.verifyToken('valid-token');

      expect(user).toBeNull();
    });
  });

  describe('getUser', () => {
    beforeEach(async () => {
      const createRequest: CreateUserRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };
      await userService.createUser(createRequest);
    });

    it('should return user if exists', () => {
      const user = userService.getUser('testuser');

      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('should return null if user does not exist', () => {
      const user = userService.getUser('nonexistent');

      expect(user).toBeNull();
    });
  });

  describe('listUsers', () => {
    it('should list all users without password hashes', async () => {
      const createRequest: CreateUserRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };
      await userService.createUser(createRequest);

      const users = userService.listUsers();

      expect(users).toHaveLength(2); // admin + testuser
      expect(users.every(u => !('passwordHash' in u))).toBe(true);
      expect(users.find(u => u.username === 'admin')).toBeDefined();
      expect(users.find(u => u.username === 'testuser')).toBeDefined();
    });
  });

  describe('deleteUser', () => {
    beforeEach(async () => {
      const createRequest: CreateUserRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };
      await userService.createUser(createRequest);
    });

    it('should delete existing user', () => {
      const result = userService.deleteUser('testuser');

      expect(result).toBe(true);
      expect(userService.getUser('testuser')).toBeNull();
    });

    it('should return false for non-existent user', () => {
      const result = userService.deleteUser('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('canAccess', () => {
    let testUser: any;
    let adminUser: any;

    beforeEach(async () => {
      const createRequest: CreateUserRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };
      testUser = await userService.createUser(createRequest);
      adminUser = userService.getUser('admin');
    });

    it('should deny access for non-authenticated users', () => {
      expect(userService.canAccess(null, 'someowner', 'read')).toBe(false);
      expect(userService.canAccess(null, 'someowner', 'write')).toBe(false);
      expect(userService.canAccess(null, 'someowner', 'delete')).toBe(false);
    });

    it('should allow access for any authenticated user (simplified model)', () => {
      expect(userService.canAccess(testUser, 'someowner', 'read')).toBe(true);
      expect(userService.canAccess(testUser, 'otheruser', 'write')).toBe(true);
      expect(userService.canAccess(testUser, 'anyuser', 'delete')).toBe(true);
    });

    it('should allow access for admin user', () => {
      expect(userService.canAccess(adminUser, 'anyuser', 'read')).toBe(true);
      expect(userService.canAccess(adminUser, 'anyuser', 'write')).toBe(true);
      expect(userService.canAccess(adminUser, 'anyuser', 'delete')).toBe(true);
    });
  });
});