import { z } from 'zod';
import { StockMovementType } from '@prisma/client';

const money = z.coerce.number().min(0).max(1_000_000_000);

export const inventoryItemCreateSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9._-]+$/, 'SKU hanya boleh huruf, angka, titik, garis bawah, dan tanda hubung.')
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(60),
  unit: z.string().trim().min(1).max(20).default('pcs'),
  quantity: z.coerce.number().int().min(0).default(0),
  minQuantity: z.coerce.number().int().min(0).default(0),
  costPrice: money.default(0),
  isActive: z.boolean().default(true),
});

export const inventoryItemUpdateSchema = inventoryItemCreateSchema
  .omit({ quantity: true })
  .partial();

export const stockMovementSchema = z
  .object({
    type: z.nativeEnum(StockMovementType),
    quantity: z.coerce.number().int().min(0).max(100_000),
    note: z.string().trim().max(200).optional(),
    bookingId: z.string().uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'IN' && value.quantity < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quantity'],
        message: 'Jumlah barang masuk minimal 1.',
      });
    }
    if (value.type === 'OUT' && value.quantity < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quantity'],
        message: 'Jumlah barang keluar minimal 1.',
      });
    }
  });

export const inventoryQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().max(60).optional(),
  lowStock: z.enum(['true', 'false']).optional(),
});
