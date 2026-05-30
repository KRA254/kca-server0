import { Hono } from "hono";
import { cacheMiddleware } from "../middleware/cache";
import { getLeaderboard } from "../../services/leaderboardService";
import { serializePerson } from "../../services/serializers";

export const leaderboardRouter = new Hono();

leaderboardRouter.get("/", cacheMiddleware(), async (c) => {
  const limit = Number(c.req.query("limit") ?? 10);
  const items = await getLeaderboard(Number.isFinite(limit) ? limit : 10);
  return c.json(items.map(serializePerson));
});
