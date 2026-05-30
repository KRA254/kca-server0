import { Hono } from "hono";
import { z } from "zod";
import { validateBody } from "../../middleware/validate";
import { ArticleModel } from "../../../models/article";
import { reviewArticle } from "../../../services/articleService";
import { logAdminAction } from "../../../services/adminAuditService";

const sourceSchema = z.object({
  title: z.string().min(2),
  url: z.string().url(),
  description: z.string().optional(),
  type: z.string().min(2),
});

const articleSchema = z.object({
  title: z.string().min(5),
  slug: z.string().optional(),
  subtitle: z.string().optional(),
  author: z.string().optional(),
  excerpt: z.string().min(10).max(5000),
  content: z.string().min(20).max(1_000_000),
  keyFinding: z.string().optional(),
  featuredImage: z.string().url(),
  images: z.array(z.string().url()).default([]),
  category: z.string().min(2),
  subCategory: z.string().optional(),
  tags: z.array(z.string()).default([]),
  sources: z.array(sourceSchema).min(1),
  status: z.enum(["draft", "submitted", "under_review", "approved", "rejected", "published", "archived"]).default("draft"),
  publishedAt: z.string().datetime().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  isBreaking: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isSponsored: z.boolean().default(false),
});

const articlePatchSchema = articleSchema.partial();

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected", "published"]),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

const audit = async (c: any, action: string, targetId: string, metadata: Record<string, unknown>) => {
  const adminWallet = c.get("adminWallet") as string;
  await logAdminAction({
    adminWallet,
    action,
    targetType: "article",
    targetId,
    metadata,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "",
    userAgent: c.req.header("user-agent") ?? "",
  });
};

const normalizeArticleDates = <T extends { publishedAt?: string; year?: number }>(body: T) => {
  const publishedAt = body.publishedAt ? new Date(body.publishedAt) : undefined;
  return {
    ...body,
    publishedAt,
    year: body.year ?? publishedAt?.getUTCFullYear(),
  };
};

export const adminArticlesRouter = new Hono();

adminArticlesRouter.get("/", async (c) => {
  const status = c.req.query("status");
  const query = status ? { status } : {};
  const items = await ArticleModel.find(query).sort({ createdAt: -1 }).limit(100).lean();
  return c.json({ items });
});

adminArticlesRouter.get("/:articleId", async (c) => {
  const article = await ArticleModel.findById(c.req.param("articleId")).lean();
  if (!article) return c.json({ error: "Not found" }, 404);
  return c.json({ article });
});

adminArticlesRouter.post("/", validateBody(articleSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof articleSchema>;
  const article = await ArticleModel.create({
    ...normalizeArticleDates(body),
    submittedPseudonym: "Kenya Corruption Archives Desk",
    views: 0,
    likes: 0,
    commentsCount: 0,
    readingTime: 1,
  });
  await audit(c, "article.create", article._id.toString(), body);
  return c.json({ article }, 201);
});

adminArticlesRouter.patch("/:articleId", validateBody(articlePatchSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof articlePatchSchema>;
  const article = await ArticleModel.findByIdAndUpdate(
    c.req.param("articleId"),
    normalizeArticleDates(body),
    { new: true, runValidators: true }
  );
  if (!article) return c.json({ error: "Not found" }, 404);
  await audit(c, "article.update", c.req.param("articleId"), body);
  return c.json({ article });
});

adminArticlesRouter.delete("/:articleId", async (c) => {
  const article = await ArticleModel.findByIdAndDelete(c.req.param("articleId"));
  if (!article) return c.json({ error: "Not found" }, 404);
  await audit(c, "article.delete", c.req.param("articleId"), {});
  return c.json({ ok: true });
});

adminArticlesRouter.post("/:articleId/review", validateBody(reviewSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof reviewSchema>;
  const adminWallet = c.get("adminWallet") as string;
  const updated = await reviewArticle({
    articleId: c.req.param("articleId"),
    status: body.status,
    adminId: adminWallet,
    reason: body.reason,
    notes: body.notes,
  });
  await audit(c, "article.review", c.req.param("articleId"), body);
  return c.json({ article: updated });
});
