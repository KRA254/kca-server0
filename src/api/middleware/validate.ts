import { createMiddleware } from "hono/factory";
import type { ZodSchema } from "zod";

export const validateBody = <T>(schema: ZodSchema<T>) =>
  createMiddleware(async (c, next) => {
    const body = await c.req.json();
    const parsed = schema.parse(body);
    c.set("validatedBody", parsed);
    await next();
  });
