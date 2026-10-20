import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

/**
 * Prisma is a singleton per process. In development, Next/tsx watchers can
 * re-import modules; reuse the client through globalThis to avoid pooling
 * dozens of connections during hot reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
