import { createMiddleware } from "hono/factory";
import { UserModel } from "../../models/user";

export const userAuthMiddleware = createMiddleware(async (c, next) => {
  const userId = c.req.header("x-user-id");
  if (userId) {
    const user = await UserModel.findById(userId);
    if (user) {
      c.set("user", user);
    }
  }
  await next();
});
