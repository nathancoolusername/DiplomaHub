import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Rate limiting no-ops (always allows) until UPSTASH_REDIS_REST_URL/TOKEN
// are set — lets everything else ship without this blocking on the user
// creating an Upstash account.
function makeLimiter(requests: number, window: `${number} ${"s" | "m" | "h"}`) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
  });
}

const LIMITERS = {
  auth: makeLimiter(5, "1 m"), // signup/login attempts
  write: makeLimiter(10, "1 m"), // comments/discussions/replies/feedback
  download: makeLimiter(30, "1 m"), // resource downloads
};

export type RateLimitKind = keyof typeof LIMITERS;

export async function checkRateLimit(
  kind: RateLimitKind,
  identifier: string,
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  const limiter = LIMITERS[kind];
  if (!limiter) return { allowed: true };

  const result = await limiter.limit(`${kind}:${identifier}`);
  if (result.success) return { allowed: true };

  return {
    allowed: false,
    error: "Too many requests — please slow down and try again shortly.",
  };
}

// Used to key auth rate limits before a user is identified. Trusts
// x-forwarded-for the same way resolveOrigin.ts trusts x-forwarded-host —
// reliable behind Vercel's edge, which sets it from the real client IP.
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
