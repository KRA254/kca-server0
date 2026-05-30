import { Hono } from "hono";
import { z } from "zod";
import { cacheMiddleware } from "../middleware/cache";
import { publicSubmissionRateLimitMiddleware } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";
import { resolveUser, touchUserActivity } from "../../services/userService";
import {
  getArticleBySlug,
  incrementArticleViewsBySlug,
  listPublishedArticles,
  listRelatedArticles,
  searchPublishedArticles,
  submitArticle,
} from "../../services/articleService";
import { serializeArticle } from "../../services/serializers";

const sourceSchema = z.object({
  title: z.string().min(2),
  url: z.string().url(),
  description: z.string().optional(),
  type: z.string().min(2),
});

const corruptionCaseSubmitSchema = z.object({
  title: z.string().min(5),
  subtitle: z.string().optional(),
  excerpt: z.string().min(20).max(5000),
  content: z.string().min(200).max(1_000_000),
  keyFinding: z.string().optional(),
  featuredImage: z.string().url(),
  images: z.array(z.string().url()).default([]),
  category: z.string().min(2),
  subCategory: z.string().optional(),
  tags: z.array(z.string()).default([]),
  sources: z.array(sourceSchema).min(1),
  year: z.number().int().min(1900).max(2100).optional(),
  isBreaking: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isSponsored: z.boolean().optional(),
  userId: z.string().optional(),
  pseudonym: z.string().optional(),
  password: z.string().min(8).optional(),
});

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const corruptionCasesRouter = new Hono();

corruptionCasesRouter.get("/", cacheMiddleware(), async (c) => {
  const items = await listPublishedArticles({
    category: c.req.query("category"),
    tag: c.req.query("tag"),
    year: c.req.query("year") ? Number(c.req.query("year")) : undefined,
    personSlug: c.req.query("personSlug"),
    personId: c.req.query("personId"),
    limit: toPositiveInt(c.req.query("limit"), 20),
    offset: toPositiveInt(c.req.query("offset"), 0),
  });
  return c.json(items.map(serializeArticle));
});

corruptionCasesRouter.get("/search", cacheMiddleware(), async (c) => {
  const query = c.req.query("q") ?? "";
  if (query.trim().length < 2) return c.json([]);
  const items = await searchPublishedArticles(query.trim(), toPositiveInt(c.req.query("limit"), 20));
  return c.json(items.map(serializeArticle));
});

corruptionCasesRouter.get("/related", cacheMiddleware(), async (c) => {
  const items = await listRelatedArticles({
    slug: c.req.query("slug"),
    personId: c.req.query("personId"),
    personSlug: c.req.query("personSlug"),
    limit: toPositiveInt(c.req.query("limit"), 4),
  });
  return c.json(items.map(serializeArticle));
});

corruptionCasesRouter.get("/:slug/key-finding", cacheMiddleware(), async (c) => {
  const article = await getArticleBySlug(c.req.param("slug"));
  if (!article) return c.json({ error: "Not found" }, 404);
  return c.json({ text: article.keyFinding ?? "" });
});

corruptionCasesRouter.get("/:slug/sources", cacheMiddleware(), async (c) => {
  const article = await getArticleBySlug(c.req.param("slug"));
  if (!article) return c.json({ error: "Not found" }, 404);
  return c.json(article.sources ?? []);
});

corruptionCasesRouter.post("/:slug/views", async (c) => {
  const article = await incrementArticleViewsBySlug(c.req.param("slug"));
  if (!article) return c.json({ error: "Not found" }, 404);
  return c.json({
    articleId: article._id.toString(),
    slug: article.slug,
    views: article.views ?? 0,
  });
});

corruptionCasesRouter.get("/:slug/views", cacheMiddleware(30), async (c) => {
  const article = await getArticleBySlug(c.req.param("slug"));
  if (!article) return c.json({ error: "Not found" }, 404);
  return c.json({
    articleId: article._id.toString(),
    slug: article.slug,
    views: article.views ?? 0,
  });
});

corruptionCasesRouter.get("/:slug", cacheMiddleware(), async (c) => {
  const article = await getArticleBySlug(c.req.param("slug"));
  if (!article) return c.json({ error: "Not found" }, 404);
  return c.json(serializeArticle(article));
});

corruptionCasesRouter.post("/", publicSubmissionRateLimitMiddleware, validateBody(corruptionCaseSubmitSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof corruptionCaseSubmitSchema>;
  const user = await resolveUser({
    userId: body.userId,
    pseudonym: body.pseudonym,
    password: body.password,
  });
  await touchUserActivity(user._id.toString());

  const article = await submitArticle({
    title: body.title,
    subtitle: body.subtitle,
    excerpt: body.excerpt,
    content: body.content,
    keyFinding: body.keyFinding,
    featuredImage: body.featuredImage,
    images: body.images,
    category: body.category,
    subCategory: body.subCategory,
    tags: body.tags,
    sources: body.sources,
    year: body.year,
    submittedById: user._id,
    submittedPseudonym: user.pseudonym,
    status: "submitted",
    isBreaking: body.isBreaking ?? false,
    isFeatured: body.isFeatured ?? false,
    isSponsored: body.isSponsored ?? false,
    views: 0,
    likes: 0,
    commentsCount: 0,
    readingTime: 1,
  });

  return c.json({
    corruptionCaseId: article._id,
    articleId: article._id,
    pseudonym: user.pseudonym,
    userId: user._id,
    status: article.status,
    message: "Thanks. Your corruption case was received and will appear after editorial review.",
  }, 201);
});
