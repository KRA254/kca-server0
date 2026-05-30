import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";
import { config } from "../../config";

export const adminAuthMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    }) as { wallet: string };
    c.set("adminWallet", payload.wallet.toLowerCase());
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
});
