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

const ANTI_CACHE_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
  "Surrogate-Control": "no-store",
};

function isAllowedOrigin(origin: string | null, request: NextRequest): boolean {
  if (!origin) return true; // Same-origin navigation or non-browser request

  try {
    const originUrl = new URL(origin);
    const hostHeader = request.headers.get("host") || request.nextUrl.host;

    // Check host match (e.g., invostock.ai, localhost:3000, vercel domain)
    if (originUrl.host === hostHeader) return true;
    if (originUrl.origin === request.nextUrl.origin) return true;

    // Configured public URL
    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (envAppUrl) {
      try {
        const parsed = new URL(envAppUrl);
        if (originUrl.host === parsed.host) return true;
      } catch {}
    }

    // Vercel deployment preview/production URL
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl && (originUrl.host === vercelUrl || originUrl.host.endsWith(".vercel.app"))) {
      return true;
    }

    // Local dev origins
    if (process.env.NODE_ENV !== "production") {
      if (
        originUrl.hostname === "localhost" ||
        originUrl.hostname === "127.0.0.1" ||
        originUrl.hostname === "192.168.0.16"
      ) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
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
        ...ANTI_CACHE_HEADERS,
      },
    }
  );
}

export async function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Enforce strict CORS policy - block untrusted cross-domain read/write requests
  if (origin && !isAllowedOrigin(origin, request)) {
    return NextResponse.json(
      { error: "Cross-Origin requests from this origin are not permitted." },
      { status: 403, headers: ANTI_CACHE_HEADERS }
    );
  }

  // Handle preflight requests securely
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin",
        ...ANTI_CACHE_HEADERS,
      },
    });
  }

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

    // Apply strict anti-caching headers on all API responses
    for (const [key, val] of Object.entries(ANTI_CACHE_HEADERS)) {
      res.headers.set(key, val);
    }

    if (origin) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Vary", "Origin");
    }

    return res;
  } catch (err) {
    console.error("[rate-limit] Upstash error, allowing request:", err);
    const fallbackRes = NextResponse.next();
    for (const [key, val] of Object.entries(ANTI_CACHE_HEADERS)) {
      fallbackRes.headers.set(key, val);
    }
    if (origin) {
      fallbackRes.headers.set("Access-Control-Allow-Origin", origin);
      fallbackRes.headers.set("Vary", "Origin");
    }
    return fallbackRes;
  }
}

export const config = {
  matcher: ["/api/:path*"],
};