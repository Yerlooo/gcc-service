import type { Request, Response } from 'express';
import { env } from '../../config/env';
import { sendOk } from '../../lib/http';
import { UnauthorizedError } from '../../lib/errors';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../../middleware/auth';
import {
  getCurrentUser,
  login as loginService,
  logout as logoutService,
  refreshSession,
  sessionTtl,
} from './auth.service';

const cookieBase = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
});

function setSessionCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, { ...cookieBase(), maxAge: sessionTtl.accessMs });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieBase(), maxAge: sessionTtl.refreshMs });
}

function clearSessionCookies(res: Response) {
  const base = cookieBase();
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const session = await loginService(email, password, {
    userAgent: req.get('user-agent') ?? undefined,
    ip: req.ip,
  });

  setSessionCookies(res, session.accessToken, session.refreshToken);
  return sendOk(res, {
    user: session.user,
    expiresAt: session.refreshExpiresAt.toISOString(),
  });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new UnauthorizedError('Sesi tidak ditemukan.');
  const session = await refreshSession(token);
  setSessionCookies(res, session.accessToken, session.refreshToken);
  return sendOk(res, {
    user: session.user,
    expiresAt: session.refreshExpiresAt.toISOString(),
  });
}

export async function logout(req: Request, res: Response) {
  await logoutService(req.cookies?.[REFRESH_COOKIE]);
  clearSessionCookies(res);
  return sendOk(res, { message: 'Berhasil keluar.' });
}

export async function me(req: Request, res: Response) {
  const user = await getCurrentUser(req.auth!.sub);
  return sendOk(res, user);
}
