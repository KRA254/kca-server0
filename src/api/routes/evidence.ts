import { Hono } from "hono";
import { cacheMiddleware } from "../middleware/cache";
import { listEvidenceTrail } from "../../services/contentService";

export const evidenceRouter = new Hono();

evidenceRouter.get("/trail", cacheMiddleware(), async (c) => {
  return c.json(await listEvidenceTrail());
});
