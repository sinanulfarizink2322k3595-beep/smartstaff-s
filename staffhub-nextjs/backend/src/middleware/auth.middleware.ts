import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';

type UserRole = 'ADMIN' | 'STAFF' | 'STUDENT' | 'SECURITY';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    organizationId: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError('Invalid token', 401));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

// Middleware to ensure user belongs to the same organization
export const checkOrganization = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const organizationId = req.params.organizationId || req.body.organizationId;

  if (organizationId && req.user?.organizationId !== organizationId) {
    return next(new AppError('Access denied to this organization', 403));
  }

  next();
};
