import type { Context } from "hono";
import { Error as MongooseError } from "mongoose";
import { ZodError } from "zod";
import { logger } from "../../lib/logger";
import { applyCorsHeaders } from "./cors";

export const errorHandler = (err: Error, c: Context) => {
  applyCorsHeaders(c);
  logger.error({ err, requestId: c.get("requestId") }, "Request error");
  if (err instanceof ZodError) {
    return c.json({
      status: 400,
      message: "Bad Request",
      code: "VALIDATION_ERROR",
      details: err.flatten().fieldErrors,
    }, 400);
  }
  if (err instanceof MongooseError.ValidationError) {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([field, error]) => [field, error.message])
    );
    return c.json({
      status: 400,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details,
    }, 400);
  }
  return c.json({
    status: 500,
    message: err.message || "Internal Server Error",
    code: "INTERNAL_SERVER_ERROR",
  }, 500);
};
