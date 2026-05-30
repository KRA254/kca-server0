import { ContentBlockModel, ContentPageModel, SiteConfigModel } from "../models/content";
import { EvidenceItemModel } from "../models/evidenceItem";
import { TickerItemModel } from "../models/tickerItem";
import { ArticleModel } from "../models/article";

export const listTicker = async () => {
  const curated = await TickerItemModel.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(20)
    .lean();
  if (curated.length > 0) {
    return curated.map((item) => ({
      id: item.articleId?.toString() ?? item._id.toString(),
      slug: item.slug,
      title: item.title,
    }));
  }
  const articles = await ArticleModel.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .limit(10)
    .lean();
  return articles.map((article) => ({
    id: article._id.toString(),
    slug: article.slug,
    title: article.title,
  }));
};

export const listEvidenceTrail = async () =>
  EvidenceItemModel.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(20)
    .select("type label status url -_id")
    .lean();

export const listContentBlocks = async (keys?: string[]) => {
  const query = keys && keys.length > 0 ? { key: { $in: keys } } : {};
  return ContentBlockModel.find(query).sort({ key: 1 }).select("key title body -_id").lean();
};

export const getContentPage = async (slug: string) =>
  ContentPageModel.findOne({ slug }).select("title kicker sections -_id").lean();

export const getSiteConfig = async () =>
  SiteConfigModel.findOne({ key: "default" }).select("brand nav footer -_id").lean();
