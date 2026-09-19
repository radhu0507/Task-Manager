import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { createError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(createError(401, 'UNAUTHORIZED', 'Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    prisma.user.findUnique({ where: { id: decoded.userId } })
      .then((user) => {
        if (!user) {
          return next(createError(401, 'UNAUTHORIZED', 'User not found'));
        }
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        };
        next();
      })
      .catch((err) => next(err));
  } catch {
    return next(createError(401, 'UNAUTHORIZED', 'Invalid token'));
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError(401, 'UNAUTHORIZED', 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(createError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }
    next();
  };
}
