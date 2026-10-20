import { z } from 'zod';
import { ServiceUnit } from '@prisma/client';

const price = z.coerce
  .number({ invalid_type_error: 'Harga harus berupa angka.' })
  .min(0, 'Harga tidak boleh negatif.')
  .max(100_000_000);

const slug = z
  .string()
  .trim()
  .min(2)
  .max(90)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung.');

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slug.optional(),
  description: z.string().trim().max(300).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const variantInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  price,
  durationMinutes: z.coerce.number().int().min(15).max(600).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});

export const serviceCreateSchema = z.object({
  categoryId: z.string().uuid('Kategori tidak valid.'),
  name: z.string().trim().min(3).max(120),
  slug: slug.optional(),
  shortDescription: z.string().trim().min(10).max(180),
  description: z.string().trim().min(30).max(5000),
  basePrice: price,
  unit: z.nativeEnum(ServiceUnit).optional(),
  durationMinutes: z.coerce.number().int().min(15).max(600).optional(),
  warrantyDays: z.coerce.number().int().min(0).max(365).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  variants: z.array(variantInputSchema).max(20).optional(),
});

export const serviceUpdateSchema = serviceCreateSchema.partial().omit({ variants: true });

export const variantUpdateSchema = variantInputSchema.partial();

export const serviceQuerySchema = z.object({
  category: z.string().trim().max(90).optional(),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;
export type VariantInput = z.infer<typeof variantInputSchema>;
