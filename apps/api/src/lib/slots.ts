import dayjs from 'dayjs';
import 'dayjs/locale/id';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const TIMEZONE = 'Asia/Jakarta';

export const TIME_SLOTS = [
  { id: '08:00-10:00', label: '08.00–10.00', start: '08:00', end: '10:00' },
  { id: '10:00-12:00', label: '10.00–12.00', start: '10:00', end: '12:00' },
  { id: '13:00-15:00', label: '13.00–15.00', start: '13:00', end: '15:00' },
  { id: '15:00-17:00', label: '15.00–17.00', start: '15:00', end: '17:00' },
] as const;

export type TimeSlotId = (typeof TIME_SLOTS)[number]['id'];

export function isValidSlot(slot: string): slot is TimeSlotId {
  return TIME_SLOTS.some((entry) => entry.id === slot);
}

export function slotLabel(slot: string): string {
  return TIME_SLOTS.find((entry) => entry.id === slot)?.label ?? slot;
}

/** Convert a Jakarta-local date (`YYYY-MM-DD`) and slot id into the UTC instant stored in Postgres. */
export function slotToDate(dateISO: string, slot: string): Date {
  const entry = TIME_SLOTS.find((item) => item.id === slot);
  if (!entry) throw new Error(`Slot tidak dikenal: ${slot}`);
  return dayjs.tz(`${dateISO} ${entry.start}`, TIMEZONE).toDate();
}

export function jakartaDayRange(dateISO: string): { start: Date; end: Date } {
  const start = dayjs.tz(`${dateISO} 00:00`, TIMEZONE);
  return {
    start: start.toDate(),
    end: start.add(1, 'day').subtract(1, 'millisecond').toDate(),
  };
}

export function todayISO(): string {
  return dayjs().tz(TIMEZONE).format('YYYY-MM-DD');
}

export function jakartaDateISO(date: Date): string {
  return dayjs(date).tz(TIMEZONE).format('YYYY-MM-DD');
}

export function isPastDate(dateISO: string): boolean {
  return dateISO < todayISO();
}

/** The farthest date a customer may book, counted from today in Jakarta. */
export function maxBookingDate(days = 60): string {
  return dayjs().tz(TIMEZONE).add(days, 'day').format('YYYY-MM-DD');
}

/** A slot on today's date stops being bookable once its start time has passed. */
export function isSlotStarted(dateISO: string, slot: string): boolean {
  return slotToDate(dateISO, slot).getTime() <= Date.now();
}

export function upcomingDates(count = 7, fromISO = todayISO()): string[] {
  const base = dayjs.tz(`${fromISO} 12:00`, TIMEZONE);
  return Array.from({ length: count }, (_, index) =>
    base.add(index, 'day').format('YYYY-MM-DD'),
  );
}

/** The last `count` dates ending today, oldest first. */
export function lastNDates(count = 7): string[] {
  const base = dayjs().tz(TIMEZONE);
  return Array.from({ length: count }, (_, index) =>
    base.subtract(count - 1 - index, 'day').format('YYYY-MM-DD'),
  );
}

export function formatJakarta(date: Date, template = 'DD MMM YYYY, HH.mm'): string {
  return dayjs(date).tz(TIMEZONE).locale('id').format(template);
}
