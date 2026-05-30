import { redis } from "../lib/redis";

export const clearRuntimeCache = async () => {
  const [cacheKeys, rateLimitKeys] = await Promise.all([
    redis.keys("cache:*"),
    redis.keys("rlflx:*"),
  ]);
  const keys = [...cacheKeys, ...rateLimitKeys];

  if (keys.length > 0) {
    await redis.del(...keys);
  }

  return {
    cacheCleared: cacheKeys.length,
    rateLimitCleared: rateLimitKeys.length,
  };
};
