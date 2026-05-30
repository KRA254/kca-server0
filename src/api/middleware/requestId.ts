import { createMiddleware } from "hono/factory";
import { v4 as uuidv4 } from "uuid";

export const requestIdMiddleware = createMiddleware(async (c, next) => {
  const requestId = c.req.header("x-request-id") ?? uuidv4();
  c.set("requestId", requestId);
  c.res.headers.set("x-request-id", requestId);
  await next();
});
