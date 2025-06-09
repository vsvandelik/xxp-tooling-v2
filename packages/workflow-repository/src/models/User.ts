export interface User {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly role: UserRole;
  readonly createdAt: Date;
  readonly lastLogin?: Date;
}

export type UserRole = 'admin' | 'user';

export interface UserCredentials {
  readonly username: string;
  readonly password: string;
}

export interface AuthToken {
  readonly token: string;
  readonly expiresAt: Date;
  readonly user: User;
}

export interface CreateUserRequest {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly role?: UserRole;
}
