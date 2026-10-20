import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  SLOT_CAPACITY: z.coerce.number().int().positive().default(3),
  WHATSAPP_PROVIDER: z.enum(['mock', 'fonnte', 'wablas']).default('mock'),
  WHATSAPP_API_URL: z.string().default('https://api.fonnte.com/send'),
  WHATSAPP_TOKEN: z.string().optional().default(''),
  ADMIN_WHATSAPP: z.string().default('6281234567890'),
  MIDTRANS_SERVER_KEY: z.string().optional().default(''),
  MIDTRANS_CLIENT_KEY: z.string().optional().default(''),
  MIDTRANS_IS_PRODUCTION: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  COOKIE_DOMAIN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('✖ Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

if (env.NODE_ENV === 'production') {
  for (const [key, value] of Object.entries({
    JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  })) {
    if (value.includes('dev-') || value.includes('change-me')) {
      throw new Error(`${key} still uses the development placeholder. Refusing to boot in production.`);
    }
  }
}
