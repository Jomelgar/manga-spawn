import type { Context, Next } from 'hono';

interface Bucket {
  count: number;
  resetAt: number;
}

export function rateLimit(max: number, windowMs: number) {
  const buckets = new Map<string, Bucket>();

  return async (c: Context, next: Next) => {
    const key = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > max) {
        return c.json({ error: 'rate_limited' }, 429);
      }
    }

    await next();
  };
}
