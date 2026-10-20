import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env';
import { UnauthorizedError } from './errors';

export interface AccessPayload {
  sub: string;
  role: Role;
  name: string;
  email: string;
}

export interface RefreshPayload {
  sub: string;
  sid: string;
}

const ISSUER = 'gcc-web';
const AUDIENCE = 'gcc-admin';

const accessOptions: SignOptions = {
  expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'],
  issuer: ISSUER,
  audience: AUDIENCE,
};

const refreshOptions: SignOptions = {
  expiresIn: env.REFRESH_TOKEN_TTL as SignOptions['expiresIn'],
  issuer: ISSUER,
  audience: AUDIENCE,
};

export const signAccessToken = (payload: AccessPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, accessOptions);

export const signRefreshToken = (payload: RefreshPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshOptions);

export function verifyAccessToken(token: string): AccessPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof decoded === 'string') throw new Error('Unexpected token payload');
    return {
      sub: String(decoded.sub),
      role: decoded.role as Role,
      name: String(decoded.name),
      email: String(decoded.email),
    };
  } catch {
    throw new UnauthorizedError('Sesi berakhir. Silakan masuk kembali.');
  }
}

export function verifyRefreshToken(token: string): RefreshPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof decoded === 'string') throw new Error('Unexpected token payload');
    return { sub: String(decoded.sub), sid: String(decoded.sid) };
  } catch {
    throw new UnauthorizedError('Sesi berakhir. Silakan masuk kembali.');
  }
}

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const randomToken = (bytes = 32): string => crypto.randomBytes(bytes).toString('hex');
