import type { Prisma } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { normalizePhone } from '../lib/codes';
import { formatRupiah } from '../lib/pricing';
import { formatJakarta, slotLabel } from '../lib/slots';

/** Only the fields a message needs, so any booking projection can be passed in. */
interface BookingForMessage {
  code: string;
  scheduledAt: Date;
  slotLabel: string;
  unitCount: number;
  total: number | string | Prisma.Decimal;
  district: string;
  city: string;
  customer: { name: string; phone: string };
  service: { name: string };
  variant?: { name: string } | null;
  technician?: { name: string } | null;
}

interface SendResult {
  ok: boolean;
  provider: string;
  detail?: string;
}

async function deliver(target: string, message: string): Promise<SendResult> {
  const to = normalizePhone(target);

  if (env.WHATSAPP_PROVIDER === 'mock' || !env.WHATSAPP_TOKEN) {
    logger.info(`[whatsapp:mock] → ${to}\n${message}`);
    return { ok: true, provider: 'mock' };
  }

  try {
    let response: Response;

    if (env.WHATSAPP_PROVIDER === 'fonnte') {
      response = await fetch(env.WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
          Authorization: env.WHATSAPP_TOKEN,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ target: to, message }),
      });
    } else {
      response = await fetch(env.WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
          Authorization: env.WHATSAPP_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: to, message }),
      });
    }

    if (!response.ok) {
      const detail = await response.text();
      logger.warn('WhatsApp provider rejected the message', { status: response.status, detail });
      return { ok: false, provider: env.WHATSAPP_PROVIDER, detail };
    }
    return { ok: true, provider: env.WHATSAPP_PROVIDER };
  } catch (error) {
    logger.error('WhatsApp delivery failed', error);
    return { ok: false, provider: env.WHATSAPP_PROVIDER, detail: String(error) };
  }
}

const trackingUrl = (code: string) => `${env.WEB_ORIGIN}/lacak?code=${encodeURIComponent(code)}`;

export async function notifyBookingCreated(booking: BookingForMessage): Promise<void> {
  const customerText = [
    `Halo ${booking.customer.name}, pesanan Anda di GCC Web sudah kami terima.`,
    '',
    `Kode: ${booking.code}`,
    `Layanan: ${booking.service.name}${booking.variant ? ` — ${booking.variant.name}` : ''} (${booking.unitCount} unit)`,
    `Jadwal: ${formatJakarta(booking.scheduledAt, 'dddd, DD MMM YYYY')} · ${slotLabel(booking.slotLabel)}`,
    `Estimasi: ${formatRupiah(booking.total)}`,
    '',
    `Pantau status: ${trackingUrl(booking.code)}`,
    'Admin akan mengonfirmasi dan menugaskan teknisi. Balas pesan ini jika ada yang perlu diubah.',
  ].join('\n');

  const adminText = [
    'Pesanan baru masuk.',
    `${booking.code} · ${booking.customer.name} · ${booking.customer.phone}`,
    `${booking.service.name}${booking.variant ? ` (${booking.variant.name})` : ''} × ${booking.unitCount}`,
    `${formatJakarta(booking.scheduledAt, 'DD MMM YYYY')} ${slotLabel(booking.slotLabel)}`,
    `${booking.district}, ${booking.city}`,
    `Total ${formatRupiah(booking.total)}`,
  ].join('\n');

  await Promise.allSettled([
    deliver(booking.customer.phone, customerText),
    deliver(env.ADMIN_WHATSAPP, adminText),
  ]);
}

export async function notifyStatusChange(
  booking: BookingForMessage,
  statusLabel: string,
  note?: string,
): Promise<void> {
  const technicianLine = booking.technician
    ? `Teknisi: ${booking.technician.name}`
    : 'Teknisi akan segera ditugaskan.';

  const text = [
    `Halo ${booking.customer.name}, status pesanan ${booking.code} diperbarui.`,
    '',
    `Status: ${statusLabel}`,
    statusLabel === 'Selesai' ? `Total akhir: ${formatRupiah(booking.total)}` : technicianLine,
    ...(note ? [`Catatan: ${note}`] : []),
    '',
    `Lihat detail: ${trackingUrl(booking.code)}`,
  ].join('\n');

  await deliver(booking.customer.phone, text);
}

export async function notifyPaymentPaid(booking: BookingForMessage): Promise<void> {
  const text = [
    `Pembayaran ${booking.code} sudah kami terima.`,
    `Total: ${formatRupiah(booking.total)}`,
    '',
    `Terima kasih. Detail pesanan: ${trackingUrl(booking.code)}`,
  ].join('\n');
  await deliver(booking.customer.phone, text);
}
