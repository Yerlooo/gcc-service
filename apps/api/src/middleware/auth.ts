import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { verifyAccessToken } from '../lib/jwt';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';

export const ACCESS_COOKIE = 'gcc_access';
export const REFRESH_COOKIE = 'gcc_refresh';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  const cookieToken = req.cookies?.[ACCESS_COOKIE];
  return typeof cookieToken === 'string' ? cookieToken : null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) return next(new UnauthorizedError('Silakan masuk terlebih dahulu.'));
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) return next(new UnauthorizedError());
    if (!roles.includes(req.auth.role)) {
      return next(new ForbiddenError('Peran akun ini tidak diizinkan untuk tindakan tersebut.'));
    }
    next();
  };
}
