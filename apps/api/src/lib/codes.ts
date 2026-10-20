import crypto from 'node:crypto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_ATTEMPTS = 5;

/** A short, human-readable code people can read over the phone. */
export function createBookingCode(now: Date = new Date()): string {
  const stamp = dayjs(now).tz('Asia/Jakarta').format('YYMMDD');
  let random = '';
  for (let i = 0; i < 4; i += 1) {
    random += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return `GCC-${stamp}-${random}`;
}

export async function createUniqueBookingCode(
  exists: (code: string) => Promise<boolean>,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const code = createBookingCode();
    if (!(await exists(code))) return code;
  }
  throw new Error('Gagal membuat kode pesanan unik. Silakan coba lagi.');
}

/** Normalise an Indonesian phone number to the 62… form used by WhatsApp. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return '••••';
  return `${phone.slice(0, 4)}••••${phone.slice(-3)}`;
}
