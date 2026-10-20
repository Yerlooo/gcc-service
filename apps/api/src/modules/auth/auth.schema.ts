import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid.').max(160),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter.').max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
