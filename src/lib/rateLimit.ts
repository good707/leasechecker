import { NextRequest } from "next/server";

// Protects routes that call the OpenAI API (which costs money) from being
// hammered by bots or scripts that find the public URL. Uses Upstash's free
// Redis tier once configured. Until UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN are set in your environment, this quietly allows
// every request through — so the app still works before you finish setup,
// it just isn't protected yet.
//
// Setup: sign up at upstash.com (free tier), create a Redis database, copy
// its REST URL and token into .env.local:
//   UPSTASH_REDIS_REST_URL=...
//   UPSTASH_REDIS_REST_TOKEN=...
// Then: npm install @upstash/ratelimit @upstash/redis

let limiter: import("@upstash/ratelimit").Ratelimit | null = null;

async function getLimiter() {
  if (limiter) return limiter;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");
  limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    // 10 requests per 60 seconds per IP — generous for a real user
    // clicking through the app, tight enough to stop scripted abuse.
    limiter: Ratelimit.slidingWindow(10, "60 s"),
  });
  return limiter;
}

/**
 * Returns true if the request should be allowed, false if it's been rate
 * limited. Call this at the top of any route that calls OpenAI.
 */
export async function checkRateLimit(req: NextRequest): Promise<boolean> {
  const rl = await getLimiter();
  if (!rl) return true; // not configured yet — allow everything

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { success } = await rl.limit(ip);
  return success;
}
