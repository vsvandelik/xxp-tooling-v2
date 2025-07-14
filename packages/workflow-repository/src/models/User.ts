/**
 * User model definitions for authentication and authorization.
 * Defines user data structures, roles, credentials, and authentication tokens
 * for the workflow repository system.
 */

/**
 * User account information and metadata.
 * Represents a registered user in the workflow repository system.
 */
export interface User {
  /** Unique identifier for the user */
  readonly id: string;
  /** Username for authentication and display */
  readonly username: string;
  /** Email address of the user */
  readonly email: string;
  /** Role determining user permissions */
  readonly role: UserRole;
  /** Timestamp when the user account was created */
  readonly createdAt: Date;
  /** Timestamp of the user's last login (if any) */
  readonly lastLogin?: Date;
}

/**
 * User role enumeration for authorization.
 * Defines the available permission levels in the system.
 */
export type UserRole = 'admin' | 'user';

/**
 * User credentials for authentication.
 * Contains username and password for login operations.
 */
export interface UserCredentials {
  /** Username for authentication */
  readonly username: string;
  /** Password for authentication */
  readonly password: string;
}

/**
 * Authentication token with user information.
 * Represents a successful authentication result with JWT token.
 */
export interface AuthToken {
  /** JWT token string for API authentication */
  readonly token: string;
  /** Token expiration timestamp */
  readonly expiresAt: Date;
  /** User information associated with the token */
  readonly user: User;
}

/**
 * Request payload for creating a new user account.
 * Contains all required information for user registration.
 */
export interface CreateUserRequest {
  /** Desired username (must be unique) */
  readonly username: string;
  /** Email address for the user */
  readonly email: string;
  /** Password for the user account */
  readonly password: string;
  /** Optional role assignment (defaults to 'user') */
  readonly role?: UserRole;
}
