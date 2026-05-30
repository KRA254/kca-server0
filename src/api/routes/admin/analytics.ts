import { Hono } from "hono";
import { ArticleModel } from "../../../models/article";
import { CorruptPersonModel } from "../../../models/corruptPerson";
import { getCaseAnalytics, getMoneyAnalytics, getPersonCorruptionAnalytics, getProjectAnalytics } from "../../../services/analyticsService";

export const adminAnalyticsRouter = new Hono();

adminAnalyticsRouter.get("/overview", async (c) => {
  const [topArticles, topPersons, submissions] = await Promise.all([
    ArticleModel.find({ status: "published" }).sort({ views: -1 }).limit(5).lean(),
    CorruptPersonModel.find().sort({ totalScore: -1 }).limit(5).lean(),
    ArticleModel.countDocuments(),
  ]);
  return c.json({
    topArticles,
    topPersons,
    submissionCount: submissions,
  });
});

adminAnalyticsRouter.get("/money", async (c) => {
  return c.json(await getMoneyAnalytics());
});

adminAnalyticsRouter.get("/cases", async (c) => {
  return c.json(await getCaseAnalytics());
});

adminAnalyticsRouter.get("/projects", async (c) => {
  return c.json(await getProjectAnalytics());
});

adminAnalyticsRouter.get("/persons", async (c) => {
  return c.json(await getPersonCorruptionAnalytics(c.req.query("personSlug")));
});
