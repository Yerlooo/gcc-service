import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { logger } from './logger';

interface AuditInput {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Prisma.InputJsonValue;
  ip?: string;
}

/**
 * Audit trails must never break the operation they describe. Write failures are
 * logged, not thrown.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        meta: input.meta,
        ip: input.ip,
      },
    });
  } catch (error) {
    logger.error('Gagal menulis audit log', { input, error });
  }
}
