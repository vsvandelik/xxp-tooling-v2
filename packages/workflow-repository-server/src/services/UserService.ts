import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  User,
  UserCredentials,
  AuthToken,
  CreateUserRequest,
  UserRole,
} from '@extremexp/workflow-repository';

interface UserData extends User {
  passwordHash: string;
}

export class UserService {
  private users = new Map<string, UserData>();
  private readonly jwtSecret: string;
  private readonly saltRounds = 10;

  constructor(jwtSecret: string) {
    this.jwtSecret = jwtSecret;
    this.initializeAdminUser();
  }

  async createUser(request: CreateUserRequest): Promise<User> {
    if (this.users.has(request.username)) {
      throw new Error('Username already exists');
    }

    const passwordHash = await bcrypt.hash(request.password, this.saltRounds);
    const user: UserData = {
      id: this.generateUserId(),
      username: request.username,
      email: request.email,
      role: request.role || 'user',
      createdAt: new Date(),
      passwordHash,
    };

    this.users.set(request.username, user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _createPwd, ...publicUser } = user;
    return publicUser;
  }

  async authenticate(credentials: UserCredentials): Promise<AuthToken | null> {
    const user = this.users.get(credentials.username);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    // Create a new user object with updated lastLogin
    const updatedUser: UserData = {
      ...user,
      lastLogin: new Date(),
    };
    this.users.set(user.username, updatedUser);

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      this.jwtSecret,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _pwd, ...publicUser } = updatedUser;
    return {
      token,
      expiresAt,
      user: publicUser,
    };
  }

  verifyToken(token: string): User | null {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as {
        userId: string;
        username: string;
        role: UserRole;
      };

      const user = this.users.get(payload.username);
      if (!user) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _verifyPwd, ...publicUser } = user;
      return publicUser;
    } catch {
      return null;
    }
  }

  getUser(username: string): User | null {
    const user = this.users.get(username);
    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _getUserPwd, ...publicUser } = user;
    return publicUser;
  }

  listUsers(): User[] {
    return Array.from(this.users.values()).map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...publicUser } = user;
      return publicUser;
    });
  }

  deleteUser(username: string): boolean {
    return this.users.delete(username);
  }

  canAccess(
    user: User | null,
    resourceOwner: string,
    operation: 'read' | 'write' | 'delete'
  ): boolean {
    if (operation === 'read') {
      return true;
    }

    if (!user) {
      return false;
    }

    if (user.role === 'admin') {
      return true;
    }

    return user.username === resourceOwner;
  }

  private initializeAdminUser(): void {
    const adminUser: UserData = {
      id: '00000000-0000-0000-0000-000000000000',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: new Date(),
      passwordHash: bcrypt.hashSync('admin123', this.saltRounds),
    };

    this.users.set('admin', adminUser);
  }

  private generateUserId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
