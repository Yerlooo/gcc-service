import { AppError, BadRequestError, NotFoundError } from '../../lib/errors';
import { normalizePhone } from '../../lib/codes';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../../lib/audit';
import { notifyPaymentPaid } from '../../integrations/whatsapp';
import {
  createSnapTransaction,
  isMidtransConfigured,
  mapTransactionStatus,
  verifySignature,
  type MidtransNotification,
} from '../../integrations/midtrans';
import type { z } from 'zod';
import type { createSnapSchema, midtransNotificationSchema } from './payments.schema';

export async function createSnap(
  input: z.infer<typeof createSnapSchema>,
  actor: { ip?: string },
) {
  if (!isMidtransConfigured()) {
    throw new AppError(
      503,
      'Pembayaran online belum tersedia. Silakan pilih transfer atau bayar tunai di lokasi.',
      'PAYMENT_UNAVAILABLE',
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { code: input.code.trim().toUpperCase() },
    include: { customer: true, service: true },
  });
  if (!booking) throw new NotFoundError('Pesanan tidak ditemukan.');
  if (normalizePhone(input.phone) !== booking.customer.phone) {
    throw new NotFoundError('Pesanan tidak ditemukan. Periksa kembali kode dan nomor Anda.');
  }
  if (booking.status === 'CANCELLED') {
    throw new BadRequestError('Pesanan sudah dibatalkan.');
  }
  if (booking.paymentStatus === 'PAID') {
    throw new BadRequestError('Pesanan ini sudah lunas.');
  }
  if (booking.paymentStatus === 'REFUNDED') {
    throw new BadRequestError('Pembayaran pesanan ini sudah direfund.');
  }

  const snap = await createSnapTransaction(booking).catch((error) => {
    if (error instanceof Error && error.message.startsWith('MIDTRANS_REJECTED')) {
      throw new AppError(502, 'Gerbang pembayaran sedang bermasalah. Coba beberapa saat lagi.', 'PAYMENT_GATEWAY_ERROR');
    }
    throw error;
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      paymentStatus: 'PENDING',
      paymentMethod: 'MIDTRANS',
      paymentRef: snap.token,
    },
  });

  await recordAudit({
    action: 'payment.snap.create',
    entity: 'Booking',
    entityId: booking.id,
    meta: { code: booking.code, token: snap.token },
    ip: actor.ip,
  });

  return {
    code: booking.code,
    token: snap.token,
    redirectUrl: snap.redirect_url,
    total: Number(booking.total),
  };
}

export async function handleNotification(
  raw: z.infer<typeof midtransNotificationSchema>,
  actor: { ip?: string },
) {
  const notification = raw as MidtransNotification;

  if (!verifySignature(notification)) {
    throw new AppError(401, 'Signature Midtrans tidak valid.', 'INVALID_SIGNATURE');
  }

  const booking = await prisma.booking.findUnique({
    where: { code: notification.order_id },
    include: {
      customer: { select: { name: true, phone: true } },
      service: { select: { name: true } },
      variant: { select: { name: true } },
      technician: { select: { name: true } },
    },
  });

  // Acknowledge unknown orders so Midtrans does not retry forever.
  if (!booking) return { received: true, ignored: true };

  if (Math.round(Number(notification.gross_amount)) !== Math.round(Number(booking.total))) {
    throw new BadRequestError('Nominal pembayaran tidak cocok dengan total pesanan.');
  }

  const outcome = mapTransactionStatus(notification);
  const wasPaid = booking.paymentStatus === 'PAID';

  if (wasPaid && outcome !== 'PAID' && outcome !== 'REFUNDED') {
    return { received: true, ignored: true };
  }

  // A refund is terminal for online notifications. Out-of-order or retried
  // events (settlement, pending) must not reopen a refunded order.
  if (booking.paymentStatus === 'REFUNDED' && outcome !== 'REFUNDED') {
    return { received: true, ignored: true };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      paymentStatus: outcome,
      paymentMethod: 'MIDTRANS',
      paymentRef: notification.transaction_id ?? booking.paymentRef,
      paidAt: outcome === 'PAID' ? booking.paidAt ?? new Date() : booking.paidAt,
    },
  });

  await recordAudit({
    action: 'payment.midtrans.notification',
    entity: 'Booking',
    entityId: booking.id,
    meta: {
      code: booking.code,
      outcome,
      transactionStatus: notification.transaction_status,
      transactionId: notification.transaction_id,
    },
    ip: actor.ip,
  });

  if (outcome === 'PAID' && !wasPaid) {
    void notifyPaymentPaid(booking).catch(() => undefined);
  }

  return { received: true, outcome };
}
