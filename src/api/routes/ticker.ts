import { Hono } from "hono";
import { cacheMiddleware } from "../middleware/cache";
import { listTicker } from "../../services/contentService";

export const tickerRouter = new Hono();

tickerRouter.get("/", cacheMiddleware(), async (c) => {
  return c.json(await listTicker());
});
