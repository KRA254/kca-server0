import { Hono } from "hono";
import { cacheMiddleware } from "../middleware/cache";
import { getCaseAnalytics, getMoneyAnalytics, getPersonCorruptionAnalytics, getProjectAnalytics } from "../../services/analyticsService";
import { serializeCase, serializePerson, serializeStalledProject } from "../../services/serializers";

export const analyticsRouter = new Hono();

analyticsRouter.get("/money", cacheMiddleware(), async (c) => {
  const data = await getMoneyAnalytics();
  return c.json({
    ...data,
    topPersons: data.topPersons.map(serializePerson),
    topCases: data.topCases.map(serializeCase),
  });
});

analyticsRouter.get("/cases", cacheMiddleware(), async (c) => {
  return c.json(await getCaseAnalytics());
});

analyticsRouter.get("/projects", cacheMiddleware(), async (c) => {
  const data = await getProjectAnalytics();
  return c.json({
    ...data,
    topProjects: data.topProjects.map(serializeStalledProject),
  });
});

analyticsRouter.get("/persons", cacheMiddleware(), async (c) => {
  const data = await getPersonCorruptionAnalytics(c.req.query("personSlug"));
  return c.json({
    ...data,
    topPersons: data.topPersons.map(serializePerson),
  });
});
