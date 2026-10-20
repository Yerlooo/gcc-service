import { z } from 'zod';
import { BookingStatus, PaymentMethod, PaymentStatus, PropertyType } from '@prisma/client';
import { normalizePhone } from '../../lib/codes';
import { isValidSlot, todayISO } from '../../lib/slots';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD.')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    // Round-trip so impossible dates such as 2026-02-30 are rejected instead
    // of silently rolling into the next month.
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Tanggal tidak valid.');

const phone = z
  .string()
  .trim()
  .min(9, 'Nomor WhatsApp terlalu pendek.')
  .max(20, 'Nomor WhatsApp terlalu panjang.')
  .refine(
    (value) => /^628[1-9][0-9]{6,11}$/.test(normalizePhone(value)),
    'Gunakan nomor WhatsApp Indonesia yang aktif, contoh 0812 3456 7890.',
  );

export const customerInputSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(100),
  phone,
  email: z
    .union([z.string().trim().email('Format email tidak valid.').max(120), z.literal('')])
    .optional()
    .transform((value) => (value ? value : undefined)),
  address: z.string().trim().min(10, 'Alamat terlalu singkat.').max(300),
  city: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'Kode pos harus 5 digit.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  notes: z.string().trim().max(300).optional(),
});

export const createBookingSchema = z.object({
  serviceId: z.string().uuid('Layanan tidak valid.'),
  variantId: z.string().uuid('Varian layanan tidak valid.').optional(),
  scheduledDate: isoDate.refine(
    (value) => value >= todayISO(),
    'Tanggal layanan sudah lewat.',
  ),
  slot: z.string().refine(isValidSlot, 'Pilih jam kedatangan yang tersedia.'),
  propertyType: z.nativeEnum(PropertyType).default(PropertyType.RUMAH),
  unitCount: z.coerce.number().int().min(1, 'Minimal 1 unit.').max(20, 'Maksimal 20 unit per pesanan.'),
  notes: z.string().trim().max(600).optional(),
  customer: customerInputSchema,
});

export const statusUpdateSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  note: z.string().trim().max(300).optional(),
});

export const assignTechnicianSchema = z.object({
  technicianId: z.string().uuid('Teknisi tidak valid.'),
  note: z.string().trim().max(300).optional(),
});

export const paymentUpdateSchema = z.object({
  status: z.nativeEnum(PaymentStatus),
  method: z.nativeEnum(PaymentMethod).optional(),
  reference: z.string().trim().max(120).optional(),
  note: z.string().trim().max(300).optional(),
});

export const adminBookingQuerySchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  technicianId: z.string().uuid().optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const availabilityQuerySchema = z.object({
  date: isoDate,
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
export type AssignTechnicianInput = z.infer<typeof assignTechnicianSchema>;
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;
