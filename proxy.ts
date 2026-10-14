import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv();

type Rule = {
  /** Sent to the client as `action` – must match the keys in RateLimitModal */
  name: string;
  limit: number;
  window: `${number} ${"s" | "m" | "h"}`;
  /**
   * Optional hard lockout. Once the limit is exceeded, this IP is blocked for
   * exactly this many seconds, regardless of where the sliding window is.
   * Rules without it just wait for the window (max = window length).
   */
  cooldownSeconds?: number;
  match: (pathname: string, method: string) => boolean;
};

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// FIRST MATCH WINS – put the most specific rules at the top.
// All non-auth windows are 1 minute, so their retry time is always <= 60s (< 2 min).
const RULES: Rule[] = [
  {
    name: "auth", // login & register submissions
    limit: 5,
    window: "1 m",
    cooldownSeconds: 6 * 60, // 6 minutes (> 5 min)
    match: (p, m) => m === "POST" && p.startsWith("/api/auth"),
  },
  {
    name: "ai_extraction",
    limit: 5,
    window: "1 m",
    match: (p) => p.includes("/upload") || p.includes("/extract"),
  },
  {
    name: "invoices",
    limit: 10,
    window: "1 m",
    match: (p) => p.startsWith("/api/invoices"),
  },
  {
    name: "inventory",
    limit: 10,
    window: "1 m",
    match: (p) => p.startsWith("/api/inventory"),
  },
  {
    name: "search",
    limit: 30,
    window: "1 m",
    match: (p) => p.startsWith("/api/search"),
  },
  {
    name: "db_write",
    limit: 20,
    window: "1 m",
    match: (_p, m) => WRITE_METHODS.has(m),
  },
  {
    name: "db_read", // catch-all (must stay last)
    limit: 60,
    window: "1 m",
    match: () => true,
  },
];

const limiters: Record<string, Ratelimit> = Object.fromEntries(
  RULES.map((r) => [
    r.name,
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(r.limit, r.window),
      prefix: `rl:${r.name}`,
    }),
  ])
);

function getIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

function blocked(rule: Rule, retryAfter: number, reset: number) {
  return NextResponse.json(
    {
      error: "Rate limit exceeded.",
      action: rule.name,
      retryAfter,
      message: "You have hit the limit for this action. Please try again later.",
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": rule.limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": reset.toString(),
        "Retry-After": retryAfter.toString(),
      },
    }
  );
}

export async function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") return NextResponse.next();

  const { pathname } = request.nextUrl;
  const rule = RULES.find((r) => r.match(pathname, request.method))!;
  const ip = getIp(request);
  const lockKey = `rl:lock:${rule.name}:${ip}`;

  try {
    // 1. Already locked out? Report the REMAINING lock time.
    if (rule.cooldownSeconds) {
      const ttl = await redis.ttl(lockKey); // -2 = no key, -1 = no expiry
      if (ttl > 0) return blocked(rule, ttl, Date.now() + ttl * 1000);
    }

    // 2. Normal sliding-window check
    const { success, limit, remaining, reset } = await limiters[rule.name].limit(ip);

    if (!success) {
      let retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));

      // 3. First violation on a cooldown rule -> start the lockout
      if (rule.cooldownSeconds) {
        await redis.set(lockKey, 1, { ex: rule.cooldownSeconds });
        retryAfter = rule.cooldownSeconds;
      }

      return blocked(rule, retryAfter, Date.now() + retryAfter * 1000);
    }

    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Limit", limit.toString());
    res.headers.set("X-RateLimit-Remaining", remaining.toString());
    return res;
  } catch (err) {
    console.error("[rate-limit] Upstash error, allowing request:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/api/:path*"],
};