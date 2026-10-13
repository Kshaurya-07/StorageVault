import { NextRequest, NextResponse } from "next/server";

/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Suitable for single-instance deployments (the default on Render's free tier).
 * For multi-instance / horizontally scaled deployments, replace the Map with a
 * shared store (Redis / Upstash) — the function signatures stay the same.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

// Prevent unbounded memory growth: cap tracked keys.
const MAX_KEYS = 10000;

function prune(bucket: Bucket, now: number, windowMs: number): void {
  const cutoff = now - windowMs;
  while (bucket.hits.length > 0 && bucket.hits[0] <= cutoff) {
    bucket.hits.shift();
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Milliseconds until the oldest hit falls out of the window (for Retry-After). */
  retryAfterMs: number;
  remaining: number;
}

/**
 * Check whether `key` is within `maxHits` per `windowMs`.
 * Records a hit when allowed.
 */
export function checkRateLimit(
  key: string,
  maxHits: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    if (buckets.size >= MAX_KEYS) {
      // Shed oldest key to bound memory (fail-open would be worse for abuse,
      // fail-closed would be worse for users; evicting LRU-ish is a middle path).
      const oldest = buckets.keys().next().value;
      if (oldest) buckets.delete(oldest);
    }
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }
  prune(bucket, now, windowMs);
  if (bucket.hits.length >= maxHits) {
    return {
      allowed: false,
      retryAfterMs: Math.max(0, bucket.hits[0] + windowMs - now),
      remaining: 0,
    };
  }
  bucket.hits.push(now);
  return { allowed: true, retryAfterMs: 0, remaining: maxHits - bucket.hits.length };
}

/** Best-effort client IP for rate-limit keying (respects common proxy headers). */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/** Build a 429 JSON response with a Retry-After header. */
export function rateLimitedResponse(retryAfterMs: number) {
  const res = NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429 }
  );
  res.headers.set("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
  return res;
}
