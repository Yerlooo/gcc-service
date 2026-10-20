import type {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  ServiceUnit,
} from './types';

export const TZ = 'Asia/Jakarta';

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function formatRupiah(value: number | string): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function dateFromISO(iso: string): Date {
  return new Date(`${iso}T12:00:00+07:00`);
}

/** YYYY-MM-DD for "today" in Jakarta, regardless of the visitor's timezone. */
export function jakartaTodayISO(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts;
}

export function addDaysISO(iso: string, days: number): string {
  const date = dateFromISO(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** YYYY-MM-DD in Jakarta for any timestamp. */
export function jakartaISOFromDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export interface DateOption {
  iso: string;
  weekday: string;
  day: string;
  month: string;
  full: string;
}

export function getUpcomingDates(count = 7, from = jakartaTodayISO()): DateOption[] {
  return Array.from({ length: count }, (_, index) => {
    const iso = addDaysISO(from, index);
    const date = dateFromISO(iso);
    return {
      iso,
      weekday: new Intl.DateTimeFormat('id-ID', {
        timeZone: TZ,
        weekday: 'short',
      }).format(date),
      day: new Intl.DateTimeFormat('id-ID', {
        timeZone: TZ,
        day: '2-digit',
      }).format(date),
      month: new Intl.DateTimeFormat('id-ID', {
        timeZone: TZ,
        month: 'short',
      }).format(date),
      full: new Intl.DateTimeFormat('id-ID', {
        timeZone: TZ,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date),
    };
  });
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(date);
}

export function formatDateTime(value: string | Date): string {
  return formatDate(value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatRelativeDay(isoDate: string): string {
  const today = jakartaTodayISO();
  if (isoDate === today) return 'Hari ini';
  if (isoDate === addDaysISO(today, 1)) return 'Besok';
  return formatDate(dateFromISO(isoDate), { weekday: 'long' });
}

export const TIME_SLOT_LABEL: Record<string, string> = {
  '08:00-10:00': '08.00–10.00',
  '10:00-12:00': '10.00–12.00',
  '13:00-15:00': '13.00–15.00',
  '15:00-17:00': '15.00–17.00',
};

export function slotLabel(slot: string): string {
  return TIME_SLOT_LABEL[slot] ?? slot;
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Menunggu konfirmasi',
  CONFIRMED: 'Dikonfirmasi',
  ASSIGNED: 'Teknisi ditugaskan',
  EN_ROUTE: 'Teknisi menuju lokasi',
  IN_PROGRESS: 'Sedang dikerjakan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const STATUS_SHORT: Record<BookingStatus, string> = {
  PENDING: 'Menunggu',
  CONFIRMED: 'Dikonfirmasi',
  ASSIGNED: 'Ditugaskan',
  EN_ROUTE: 'Di jalan',
  IN_PROGRESS: 'Dikerjakan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const STATUS_TONE: Record<BookingStatus, string> = {
  PENDING: 'bg-amber/10 text-amber border-amber/30',
  CONFIRMED: 'bg-teal-soft text-teal border-teal/25',
  ASSIGNED: 'bg-teal-soft text-teal border-teal/25',
  EN_ROUTE: 'bg-teal-soft text-teal border-teal/25',
  IN_PROGRESS: 'bg-teal text-bone border-teal',
  COMPLETED: 'bg-ink text-bone border-ink',
  CANCELLED: 'bg-surface text-muted border-line',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: 'Belum dibayar',
  PENDING: 'Menunggu pembayaran',
  PAID: 'Lunas',
  FAILED: 'Gagal',
  REFUNDED: 'Direfund',
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Tunai',
  TRANSFER: 'Transfer bank',
  QRIS: 'QRIS',
  EWALLET: 'E-wallet',
  MIDTRANS: 'Pembayaran online',
};

export const UNIT_LABEL: Record<ServiceUnit, string> = {
  UNIT: 'unit',
  POINT: 'titik',
  PACKAGE: 'paket',
  METER: 'meter',
};

export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['EN_ROUTE', 'CANCELLED'],
  EN_ROUTE: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const STATUS_ACTION_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Kembalikan ke menunggu',
  CONFIRMED: 'Konfirmasi jadwal',
  ASSIGNED: 'Tandai ditugaskan',
  EN_ROUTE: 'Teknisi berangkat',
  IN_PROGRESS: 'Mulai pekerjaan',
  COMPLETED: 'Selesaikan pekerjaan',
  CANCELLED: 'Batalkan pesanan',
};

export const TIMELINE_STEPS: Array<{
  status: BookingStatus;
  title: string;
  description: string;
}> = [
  {
    status: 'PENDING',
    title: 'Pesanan diterima',
    description: 'Kode tiket dibuat dan ringkasan dikirim ke WhatsApp Anda.',
  },
  {
    status: 'CONFIRMED',
    title: 'Jadwal dikonfirmasi',
    description: 'Admin memeriksa alamat dan ketersediaan slot.',
  },
  {
    status: 'ASSIGNED',
    title: 'Teknisi ditugaskan',
    description: 'Nama teknisi muncul di halaman pelacakan.',
  },
  {
    status: 'EN_ROUTE',
    title: 'Teknisi berangkat',
    description: 'Anda menerima pembaruan saat teknisi menuju lokasi.',
  },
  {
    status: 'IN_PROGRESS',
    title: 'Pekerjaan dimulai',
    description: 'Temuan dan biaya tambahan disepakati sebelum dikerjakan.',
  },
  {
    status: 'COMPLETED',
    title: 'Selesai & diuji',
    description: 'Hasil diuji bersama Anda, pembayaran dicatat, garansi aktif.',
  },
];

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return '••••';
  return `${digits.slice(0, 4)}••••${digits.slice(-3)}`;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
