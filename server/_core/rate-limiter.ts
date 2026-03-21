/**
 * EketSupply Rate Limiting
 *
 * Three tiers of rate limiting to protect the API:
 *
 * 1. authLimiter      — Login / OAuth endpoints: 10 req / 15 min per IP
 *                       Prevents brute-force credential attacks.
 *
 * 2. paystackLimiter  — Payment endpoints: 20 req / 1 min per IP
 *                       Prevents payment enumeration and abuse.
 *
 * 3. apiLimiter       — All other /api/trpc routes: 120 req / 1 min per IP
 *                       General DDoS protection.
 *
 * All limiters use a sliding-window in-memory store (no Redis required).
 * In a multi-instance deployment, replace the default MemoryStore with
 * a shared Redis store (e.g. `rate-limit-redis`).
 */
import rateLimit from "express-rate-limit";

/** Helper: extract a human-readable retry-after header value */
const retryAfterHandler = (
  _req: import("express").Request,
  _res: import("express").Response,
  next: import("express").NextFunction,
  options: { windowMs: number }
) => {
  const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
  _res.set("Retry-After", String(retryAfterSeconds));
  _res.status(429).json({
    error: {
      code: "TOO_MANY_REQUESTS",
      message: `Too many requests. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
    },
  });
};

/**
 * Auth rate limiter — applied to OAuth and session endpoints.
 * 10 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: retryAfterHandler,
  skip: () => process.env.NODE_ENV === "test",
});

/**
 * Paystack rate limiter — applied to all /api/trpc/paystack.* routes.
 * 20 requests per minute per IP.
 */
export const paystackLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: retryAfterHandler,
  skip: () => process.env.NODE_ENV === "test",
});

/**
 * General API rate limiter — applied to all /api/trpc routes.
 * 120 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: retryAfterHandler,
  skip: () => process.env.NODE_ENV === "test",
});
