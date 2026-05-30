import { createMiddleware } from "hono/factory";
import { redis } from "../../lib/redis";
import { config } from "../../config";

const CACHE_TIMEOUT_MS = 250;

const withRedisTimeout = <T>(operation: Promise<T>) =>
  new Promise<T | undefined>((resolve) => {
    const timer = setTimeout(() => resolve(undefined), CACHE_TIMEOUT_MS);
    operation
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(undefined);
      });
  });

export const cacheMiddleware = (ttlSeconds = config.cacheTtlSeconds) =>
  createMiddleware(async (c, next) => {
    const cacheKey = `cache:${c.req.method}:${c.req.url}`;
    const cached = await withRedisTimeout(redis.get(cacheKey));
    if (cached) {
      try {
        c.header("x-cache", "HIT");
        return c.json(JSON.parse(cached));
      } catch {
        await withRedisTimeout(redis.del(cacheKey));
      }
    }

    await next();

    if (c.res.status === 200) {
      try {
        const data = await c.res.clone().json();
        void redis.setex(cacheKey, ttlSeconds, JSON.stringify(data)).catch(() => undefined);
        c.header("x-cache", "MISS");
      } catch {
        c.header("x-cache", "SKIP");
      }
    }
  });
