import { z } from 'zod';
import { normalizePhone } from '../../lib/codes';

const phone = z
  .union([
    z
      .string()
      .trim()
      .refine(
        (value) => /^628[1-9][0-9]{6,11}$/.test(normalizePhone(value)),
        'Nomor WhatsApp tidak valid.',
      ),
    z.literal('').transform(() => undefined),
  ])
  .optional();

const specialties = z
  .array(z.string().trim().min(2).max(40))
  .max(8)
  .transform((values) => Array.from(new Set(values)));

export const technicianCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email('Format email tidak valid.').max(120),
  phone,
  password: z.string().min(8, 'Kata sandi minimal 8 karakter.').max(72),
  zone: z.string().trim().min(2, 'Zona wajib diisi.').max(120),
  specialties: specialties.default([]),
  capacityPerDay: z.coerce.number().int().min(1).max(12).default(4),
  isAvailable: z.boolean().default(true),
  notes: z.string().trim().max(300).optional(),
});

export const technicianUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email('Format email tidak valid.').max(120).optional(),
  phone,
  password: z.string().min(8, 'Kata sandi minimal 8 karakter.').max(72).optional(),
  zone: z.string().trim().min(2).max(120).optional(),
  specialties: specialties.optional(),
  capacityPerDay: z.coerce.number().int().min(1).max(12).optional(),
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(300).optional(),
});

export const technicianQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD.')
    .optional(),
});
