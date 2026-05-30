import { createMiddleware } from "hono/factory";
import { logger } from "../../lib/logger";

export const loggerMiddleware = createMiddleware(async (c, next) => {
  const start = Date.now();
  await next();
  const durationMs = Date.now() - start;
  logger.info({
    requestId: c.get("requestId"),
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs,
  });
});
