/* ═══════════════════════════════════════════════════════════════
   In-memory rate limiting
   ═══════════════════════════════════════════════════════════════
   Uses `rate-limiter-flexible` with an in-memory store. This is
   per-process only — sufficient for MVP / single-region deploys.
   For multi-instance production, swap to Upstash Redis or a
   RateLimiterRedis instance.

   Callers:
     const limited = await checkRateLimit("login", ip, 5, 60);
     if (limited) return limited;   // short-circuit with 429
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextResponse } from "next/server";

const limiters = new Map<string, RateLimiterMemory>();

function getLimiter(name: string, points: number, duration: number) {
  const key = `${name}:${points}:${duration}`;
  let l = limiters.get(key);
  if (!l) {
    l = new RateLimiterMemory({ keyPrefix: name, points, duration });
    limiters.set(key, l);
  }
  return l;
}

/**
 * Consume one point for the given key. Returns a 429 Response on
 * overflow, or null on success.
 *
 * @param name   A stable bucket name (e.g. "login", "ai-action").
 * @param key    The identifying key (e.g. IP, userId).
 * @param points Max requests per window.
 * @param duration Window in seconds.
 */
export async function checkRateLimit(
  name: string,
  key: string,
  points: number,
  duration: number
): Promise<Response | null> {
  const limiter = getLimiter(name, points, duration);
  try {
    await limiter.consume(key, 1);
    return null;
  } catch (rej: any) {
    const retry = Math.ceil((rej?.msBeforeNext ?? duration * 1000) / 1000);
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retry),
          "X-RateLimit-Limit": String(points),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }
}
