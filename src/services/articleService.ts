import { ArticleModel } from "../models/article";
import { CorruptPersonModel } from "../models/corruptPerson";
import { CorruptionCaseModel } from "../models/corruptionCase";

export type ArticleCreateInput = {
  title: string;
  slug?: string;
  subtitle?: string;
  author?: string;
  excerpt: string;
  content: string;
  keyFinding?: string;
  featuredImage: string;
  images: string[];
  category: string;
  subCategory?: string;
  tags: string[];
  sources: Array<{ title: string; url: string; description?: string; type: string }>;
  submittedById?: unknown;
  submittedPseudonym?: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "published" | "archived";
  publishedAt?: Date;
  year?: number;
  isBreaking: boolean;
  isFeatured: boolean;
  isSponsored: boolean;
  views: number;
  likes: number;
  commentsCount: number;
  readingTime: number;
};

export type ArticleListFilters = {
  category?: string;
  tag?: string;
  year?: number;
  personSlug?: string;
  personId?: string;
  limit?: number;
  offset?: number;
};

const articleIdsForPerson = async (personId?: string, personSlug?: string) => {
  let resolvedPersonId = personId;
  if (!resolvedPersonId && personSlug) {
    const person = await CorruptPersonModel.findOne({ slug: personSlug }).select("_id").lean();
    resolvedPersonId = person?._id.toString();
    if (!resolvedPersonId) return [];
  }
  if (!resolvedPersonId) return undefined;
  return CorruptionCaseModel.find({
    $or: [{ personId: resolvedPersonId }, { "linkedPersons.personId": resolvedPersonId }],
  }).distinct("articleId");
};

export const listPublishedArticles = async (filters: ArticleListFilters = {}) => {
  const query: Record<string, unknown> = { status: "published" };
  if (filters.category) query.category = filters.category;
  if (filters.tag) query.tags = filters.tag;
  if (filters.year) query.year = filters.year;
  const articleIds = await articleIdsForPerson(filters.personId, filters.personSlug);
  if (articleIds) query._id = { $in: articleIds };

  return ArticleModel.find(query)
    .sort({ publishedAt: -1 })
    .skip(filters.offset ?? 0)
    .limit(filters.limit ?? 20)
    .lean();
};

export const getArticleBySlug = async (slug: string) =>
  ArticleModel.findOne({ slug, status: "published" }).lean();

export const submitArticle = async (payload: ArticleCreateInput) => ArticleModel.create(payload);

export const searchPublishedArticles = async (query: string, limit = 20) =>
  ArticleModel.find({
    status: "published",
    $or: [
      { title: { $regex: query, $options: "i" } },
      { subtitle: { $regex: query, $options: "i" } },
      { excerpt: { $regex: query, $options: "i" } },
      { content: { $regex: query, $options: "i" } },
      { tags: { $in: [new RegExp(query, "i")] } },
    ],
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

export const listRelatedArticles = async (input: {
  slug?: string;
  personId?: string;
  personSlug?: string;
  limit?: number;
}) => {
  const limit = input.limit ?? 4;
  const query: Record<string, unknown> = { status: "published" };

  if (input.slug) {
    const article = await ArticleModel.findOne({ slug: input.slug, status: "published" }).lean();
    if (!article) return [];
    query.slug = { $ne: article.slug };
    query.$or = [{ category: article.category }, { tags: { $in: article.tags ?? [] } }];
  }

  const articleIds = await articleIdsForPerson(input.personId, input.personSlug);
  if (articleIds) query._id = { $in: articleIds };

  return ArticleModel.find(query).sort({ publishedAt: -1 }).limit(limit).lean();
};

export const incrementArticleViewsBySlug = async (slug: string) =>
  ArticleModel.findOneAndUpdate(
    { slug, status: "published" },
    { $inc: { views: 1 } },
    { new: true }
  ).lean();

export const reviewArticle = async (input: {
  articleId: string;
  status: "approved" | "rejected" | "published";
  adminId: string;
  reason?: string;
  notes?: string;
}) => {
  const update: Record<string, unknown> = {
    status: input.status,
    reviewedBy: input.adminId,
    moderationNotes: input.notes,
  };
  if (input.status === "approved" || input.status === "published") {
    update.approvedBy = input.adminId;
    if (input.status === "published") {
      const now = new Date();
      update.publishedAt = now;
      const existing = await ArticleModel.findById(input.articleId).select("year").lean();
      update.year = existing?.year ?? now.getUTCFullYear();
    }
  }
  if (input.status === "rejected") {
    update.rejectedReason = input.reason ?? "";
  }
  return ArticleModel.findByIdAndUpdate(input.articleId, update, { new: true });
};
