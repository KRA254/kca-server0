import type { Context, Next } from "hono";
import { config } from "../../config";

const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;

const fallbackOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const allowedOrigins = new Set([...fallbackOrigins, ...config.corsOrigins]);

export const resolveCorsOrigin = (origin: string | undefined | null) => {
  if (!origin) return fallbackOrigins[0];
  if (allowedOrigins.has(origin)) return origin;
  if (config.nodeEnv !== "production" && localDevOriginPattern.test(origin)) return origin;
  return null;
};

export const applyCorsHeaders = (c: Context) => {
  const origin = resolveCorsOrigin(c.req.header("origin"));
  if (!origin) return;

  c.header("Access-Control-Allow-Origin", origin);
  c.header("Vary", "Origin");
  c.header("Access-Control-Allow-Credentials", "true");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  c.header("Access-Control-Expose-Headers", "Content-Length, X-Request-Id");
  c.header("Access-Control-Max-Age", "600");
};

export const corsMiddleware = async (c: Context, next: Next) => {
  applyCorsHeaders(c);

  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: c.res.headers });
  }

  try {
    await next();
  } finally {
    applyCorsHeaders(c);
  }
};
