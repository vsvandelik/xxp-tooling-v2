/**
 * Authentication middleware for Express.js workflows.
 * Provides JWT token validation, user context injection, and role-based
 * authorization for protected API endpoints.
 */

import { User } from '@extremexp/workflow-repository';
import { Request, Response, NextFunction } from 'express';

import { UserService } from '../services/UserService.js';

declare global {
  namespace Express {
    interface Request {
      /** Authenticated user object attached to request */
      user?: User;
    }
  }
}

/**
 * Middleware class providing authentication and authorization for HTTP requests.
 * Handles JWT token validation, user context injection, and role-based access control
 * for protecting workflow repository API endpoints.
 */
export class AuthenticationMiddleware {
  /**
   * Creates a new authentication middleware instance.
   *
   * @param userService - Service for user authentication and authorization
   */
  constructor(private userService: UserService) {}

  /**
   * Middleware to extract and validate JWT tokens from Authorization header.
   * Attaches user object to request if token is valid, continues regardless.
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Don't assign undefined to optional property
      delete (req as any).user;
      next();
      return;
    }

    const token = authHeader.substring(7);
    const user = this.userService.verifyToken(token);

    if (user) {
      req.user = user;
    } else {
      delete (req as any).user;
    }
    next();
  };

  /**
   * Middleware to require authentication for protected endpoints.
   * Returns 401 Unauthorized if no valid user is attached to request.
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    next();
  };

  /**
   * Middleware to require admin role for administrative endpoints.
   * Returns 403 Forbidden if user is not authenticated or not an admin.
   * Note: This is kept for backward compatibility but with simplified model,
   * all authenticated users have the same permissions.
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    next();
  };
}
