import rateLimit from 'express-rate-limit';

const standard = {
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak permintaan. Coba lagi beberapa saat lagi.',
    },
  },
} as const;

/** Broad ceiling for the public API. */
export const publicLimiter = rateLimit({
  ...standard,
  windowMs: 60 * 1000,
  limit: 120,
});

/** Login brute-force protection: 8 attempts per IP per 15 minutes. */
export const loginLimiter = rateLimit({
  ...standard,
  windowMs: 15 * 60 * 1000,
  limit: 8,
  skipSuccessfulRequests: true,
});

/** A booking writes a customer, a status row and a WhatsApp message. */
export const bookingLimiter = rateLimit({
  ...standard,
  windowMs: 60 * 60 * 1000,
  limit: 10,
});

/** Tracking codes are guessable enough to need a tight window. */
export const trackLimiter = rateLimit({
  ...standard,
  windowMs: 15 * 60 * 1000,
  limit: 20,
});

/**
 * Gateway callbacks arrive from a shared set of provider IPs and are retried,
 * so the ceiling is per provider IP, not per end customer. Signature
 * verification is the real control here.
 */
export const gatewayLimiter = rateLimit({
  ...standard,
  windowMs: 15 * 60 * 1000,
  limit: 1000,
});
