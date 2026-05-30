import { Hono } from "hono";
import { listCasesForArticle, listCasesForPerson } from "../../services/caseService";
import { serializeCase } from "../../services/serializers";

export const casesRouter = new Hono();

casesRouter.get("/persons/:personId", async (c) => {
  const cases = await listCasesForPerson(c.req.param("personId"));
  return c.json(cases.map(serializeCase));
});

casesRouter.get("/articles/:articleId", async (c) => {
  const cases = await listCasesForArticle(c.req.param("articleId"));
  return c.json(cases.map(serializeCase));
});
