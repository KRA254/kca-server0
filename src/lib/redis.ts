import { Redis } from "ioredis";
import { config } from "../config";
import { logger } from "./logger";

export const redis = new Redis(config.redisUrl, {
  connectTimeout: 5000,
  commandTimeout: 1000,
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
});

redis.on("ready", () => logger.info("Redis ready"));
redis.on("error", (err: Error) => logger.error({ err }, "Redis error"));
