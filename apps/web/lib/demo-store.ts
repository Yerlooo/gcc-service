import type { TrackedBooking } from './types';

const STORAGE_KEY = 'gcc:demo-bookings';

export function saveDemoBooking(booking: TrackedBooking): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = readDemoBookings();
    const next = [booking, ...existing.filter((item) => item.code !== booking.code)].slice(0, 10);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable in private mode; the flow still works for this page.
  }
}

export function findDemoBooking(code: string): TrackedBooking | null {
  if (typeof window === 'undefined') return null;
  const normalized = code.trim().toUpperCase();
  return readDemoBookings().find((item) => item.code === normalized) ?? null;
}

function readDemoBookings(): TrackedBooking[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as TrackedBooking[]) : [];
  } catch {
    return [];
  }
}
