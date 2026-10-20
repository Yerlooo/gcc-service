import type { BookingStatus } from '@prisma/client';

export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Menunggu konfirmasi',
  CONFIRMED: 'Dikonfirmasi',
  ASSIGNED: 'Teknisi ditugaskan',
  EN_ROUTE: 'Teknisi menuju lokasi',
  IN_PROGRESS: 'Sedang dikerjakan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

/** The state machine is enforced on the server, not only in the dashboard UI. */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['EN_ROUTE', 'CANCELLED'],
  EN_ROUTE: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
