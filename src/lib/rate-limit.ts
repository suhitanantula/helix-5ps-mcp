import { RATE_LIMIT_BURST, RATE_LIMIT_PER_MIN } from "./limits";

type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Best-effort per-instance token bucket.
 * Serverless instances do not share memory; scope says ~60/min, burst 20.
 */
export function checkRateLimit(ip: string): {
  ok: boolean;
  retryAfterSec: number;
} {
  const now = Date.now();
  const refillPerMs = RATE_LIMIT_PER_MIN / 60_000;
  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { tokens: RATE_LIMIT_BURST, updatedAt: now };
    buckets.set(ip, bucket);
  } else {
    const elapsed = now - bucket.updatedAt;
    bucket.tokens = Math.min(
      RATE_LIMIT_BURST,
      bucket.tokens + elapsed * refillPerMs,
    );
    bucket.updatedAt = now;
  }

  if (bucket.tokens < 1) {
    const deficit = 1 - bucket.tokens;
    const retryAfterSec = Math.max(1, Math.ceil(deficit / refillPerMs / 1000));
    return { ok: false, retryAfterSec };
  }

  bucket.tokens -= 1;
  return { ok: true, retryAfterSec: 0 };
}

/** Test helper. */
export function resetRateLimits(): void {
  buckets.clear();
}
