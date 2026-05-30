import { Hono } from "hono";
import mongoose from "mongoose";
import { redis } from "../../../lib/redis";

export const healthRouter = new Hono();

healthRouter.get("/health", (c) => c.json({ status: "ok" }));

healthRouter.get("/ready", async (c) => {
  const mongoReady = mongoose.connection.readyState === 1;
  const redisReady = (await redis.ping()) === "PONG";
  if (!mongoReady || !redisReady) {
    return c.json({ status: "degraded", mongoReady, redisReady }, 503);
  }
  return c.json({ status: "ready", mongoReady, redisReady });
});
