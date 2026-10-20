import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import type { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../lib/errors';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../lib/jwt';
import { durationToMs } from '../../lib/utils';

const refreshTtlMs = durationToMs(env.REFRESH_TOKEN_TTL, 7 * 86_400_000);

/**
 * Compared against when the email is unknown, so a missing account takes the
 * same time as a wrong password. The plaintext is irrelevant; only the hash
 * must be a valid bcrypt string.
 */
const DUMMY_PASSWORD_HASH =
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

export type SafeUser = Pick<User, 'id' | 'name' | 'email' | 'phone' | 'role' | 'isActive'> & {
  technician: { zone: string; capacityPerDay: number; isAvailable: boolean } | null;
};

const toSafeUser = (user: User & { technician?: { zone: string; capacityPerDay: number; isAvailable: boolean } | null }): SafeUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isActive: user.isActive,
  technician: user.technician
    ? {
        zone: user.technician.zone,
        capacityPerDay: user.technician.capacityPerDay,
        isAvailable: user.technician.isAvailable,
      }
    : null,
});

export async function login(
  email: string,
  password: string,
  meta: { userAgent?: string; ip?: string },
) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { technician: true },
  });

  // Always run one bcrypt comparison so response time does not reveal whether
  // the email exists.
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!user || !valid || !user.isActive) {
    throw new UnauthorizedError('Email atau kata sandi salah.');
  }

  const sid = crypto.randomUUID();
  const refreshToken = signRefreshToken({ sub: user.id, sid });
  const refreshExpiresAt = new Date(Date.now() + refreshTtlMs);

  await prisma.session.create({
    data: {
      id: sid,
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      userAgent: meta.userAgent?.slice(0, 300),
      ip: meta.ip,
      expiresAt: refreshExpiresAt,
    },
  });

  return {
    user: toSafeUser(user),
    accessToken: signAccessToken({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    }),
    refreshToken,
    refreshExpiresAt,
  };
}

export async function refreshSession(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const session = await prisma.session.findUnique({
    where: { id: payload.sid },
    include: { user: { include: { technician: true } } },
  });

  if (
    !session ||
    session.userId !== payload.sub ||
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now()
  ) {
    throw new UnauthorizedError('Sesi sudah berakhir.');
  }

  if (session.refreshTokenHash !== hashToken(refreshToken)) {
    // A valid token was replayed with a stale hash: revoke everything for safety.
    await prisma.session.updateMany({
      where: { userId: session.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new UnauthorizedError('Sesi tidak valid. Silakan masuk kembali.');
  }

  if (!session.user.isActive) {
    throw new UnauthorizedError('Akun ini sedang dinonaktifkan.');
  }

  const technician = session.user.technician ?? null;

  const newRefreshToken = signRefreshToken({ sub: session.userId, sid: session.id });
  const refreshExpiresAt = new Date(Date.now() + refreshTtlMs);

  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: hashToken(newRefreshToken),
      expiresAt: refreshExpiresAt,
    },
  });

  return {
    user: toSafeUser({ ...session.user, technician }),
    accessToken: signAccessToken({
      sub: session.user.id,
      role: session.user.role,
      name: session.user.name,
      email: session.user.email,
    }),
    refreshToken: newRefreshToken,
    refreshExpiresAt,
  };
}

export async function logout(refreshToken?: string): Promise<void> {
  if (!refreshToken) return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    await prisma.session.update({
      where: { id: payload.sid },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Logging out with an expired token is still a successful logout.
  }
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { technician: true },
  });
  if (!user || !user.isActive) throw new UnauthorizedError('Akun tidak ditemukan.');
  return toSafeUser(user);
}

export const sessionTtl = {
  accessMs: durationToMs(env.ACCESS_TOKEN_TTL, 15 * 60_000),
  refreshMs: refreshTtlMs,
};
