import crypto from 'node:crypto';
import { env } from '../config/env';
import type { Booking, Customer, Service } from '@prisma/client';

type BookingForPayment = Booking & { customer: Customer; service: Service };

export const isMidtransConfigured = (): boolean => Boolean(env.MIDTRANS_SERVER_KEY);

const snapBase = () =>
  env.MIDTRANS_IS_PRODUCTION
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

export interface SnapTransaction {
  token: string;
  redirect_url: string;
}

export async function createSnapTransaction(booking: BookingForPayment): Promise<SnapTransaction> {
  if (!isMidtransConfigured()) {
    throw new Error('MIDTRANS_NOT_CONFIGURED');
  }

  const authorization = Buffer.from(`${env.MIDTRANS_SERVER_KEY}:`).toString('base64');

  const payload = {
    transaction_details: {
      order_id: booking.code,
      gross_amount: Math.round(Number(booking.total)),
    },
    item_details: [
      {
        id: booking.serviceId,
        price: Math.round(Number(booking.total)),
        quantity: 1,
        name: booking.service.name.slice(0, 50),
      },
    ],
    customer_details: {
      first_name: booking.customer.name.slice(0, 50),
      phone: booking.customer.phone,
      ...(booking.customer.email ? { email: booking.customer.email } : {}),
      billing_address: {
        address: booking.address,
        city: booking.city,
        postal_code: booking.postalCode ?? undefined,
        country_code: 'IDN',
      },
    },
    callbacks: {
      finish: `${env.WEB_ORIGIN}/lacak?code=${booking.code}`,
    },
  };

  const response = await fetch(snapBase(), {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authorization}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`MIDTRANS_REJECTED: ${response.status} ${detail}`);
  }

  return (await response.json()) as SnapTransaction;
}

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  transaction_id?: string;
  payment_type?: string;
}

export function verifySignature(notification: MidtransNotification): boolean {
  const raw = `${notification.order_id}${notification.status_code}${notification.gross_amount}${env.MIDTRANS_SERVER_KEY}`;
  const expected = crypto.createHash('sha512').update(raw).digest('hex');
  const received = notification.signature_key ?? '';

  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export type PaymentOutcome = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';

export function mapTransactionStatus(notification: MidtransNotification): PaymentOutcome {
  const status = notification.transaction_status;
  const fraud = notification.fraud_status;

  if (status === 'capture') {
    return fraud === 'challenge' ? 'PENDING' : 'PAID';
  }
  if (status === 'settlement') return 'PAID';
  if (status === 'pending') return 'PENDING';
  if (status === 'refund' || status === 'partial_refund') return 'REFUNDED';
  if (status === 'deny' || status === 'cancel' || status === 'expire' || status === 'failure') {
    return 'FAILED';
  }
  return 'PENDING';
}
