import { z } from 'zod';

export const testimonialCreateSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  customerMeta: z.string().trim().max(120).optional(),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  content: z.string().trim().min(10, 'Testimoni minimal 10 karakter.').max(600),
  serviceId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const testimonialUpdateSchema = testimonialCreateSchema.partial();

export const testimonialSubmitSchema = z.object({
  code: z.string().trim().min(5).max(30),
  phone: z.string().trim().min(9).max(20),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  content: z.string().trim().min(10, 'Testimoni minimal 10 karakter.').max(600),
});

export const testimonialQuerySchema = z.object({
  featured: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().positive().max(24).default(9),
});
