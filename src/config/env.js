import 'dotenv/config';
import { z } from 'zod';

const bool = z.enum(['true', 'false']).transform((v) => v === 'true');
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().min(1),
  PUBLIC_BASE_URL: z.string().url(),
  DB_HOST: z.string().min(1), DB_PORT: z.coerce.number().int().positive(), DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1), DB_PASSWORD: z.string(), DB_POOL_SIZE: z.coerce.number().int().positive().default(10),
  JWT_SECRET: z.string().min(32), SESSION_SECRET: z.string().min(32), SESSION_TTL_SECONDS: z.coerce.number().int().positive(),
  COOKIE_SECURE: bool.default('false'), CSRF_COOKIE_NAME: z.string().min(1),
  OTP_TTL_SECONDS: z.coerce.number().int().positive(), OTP_RESEND_SECONDS: z.coerce.number().int().positive(),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive(), OTP_LENGTH: z.coerce.number().int().min(4).max(8),
  SMTP_HOST: z.string(), SMTP_PORT: z.coerce.number().int().positive(), SMTP_SECURE: bool.default('false'),
  SMTP_USER: z.string(), SMTP_PASSWORD: z.string(), MAIL_FROM: z.string(), ADMIN_NOTIFICATION_EMAIL: z.string(),
  UPLOAD_DIR: z.string().min(1), MAX_UPLOAD_BYTES: z.coerce.number().int().positive(),
  MAX_IMAGE_WIDTH: z.coerce.number().int().positive(), MAX_IMAGE_HEIGHT: z.coerce.number().int().positive()
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}
export const env = parsed.data;
