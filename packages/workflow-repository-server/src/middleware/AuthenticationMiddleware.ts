import { Request, Response, NextFunction } from 'express';
import { User } from '@extremexp/workflow-repository';
import { UserService } from '../services/UserService.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export class AuthenticationMiddleware {
  constructor(private userService: UserService) {}

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

  requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    next();
  };

  requireOwnerOrAdmin = (getResourceOwner: (req: Request) => string | null) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const resourceOwner = getResourceOwner(req);

      if (!resourceOwner) {
        res.status(404).json({
          success: false,
          error: 'Resource not found',
        });
        return;
      }

      if (!this.userService.canAccess(req.user || null, resourceOwner, 'write')) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      next();
    };
  };
}
