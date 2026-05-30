import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import slugify from "slugify";

const SourceSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 120 },
    url: { type: String, required: true },
    description: { type: String, required: false, maxlength: 500 },
    type: { type: String, required: true, maxlength: 40 },
  },
  { _id: false }
);

const ArticleSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 220 },
    slug: { type: String, required: true, unique: true, index: true },
    subtitle: { type: String, required: false, maxlength: 280 },
    author: { type: String, required: false, maxlength: 120 },
    excerpt: { type: String, required: true, maxlength: 5000 },
    content: { type: String, required: true },
    keyFinding: { type: String, required: false, maxlength: 500 },
    featuredImage: { type: String, required: true },
    images: { type: [String], required: true, default: [] },
    category: { type: String, required: true, index: true },
    subCategory: { type: String, required: false },
    tags: { type: [String], required: true, default: [] },
    sources: {
      type: [SourceSchema],
      required: true,
      validate: {
        validator: (sources: unknown[]) => Array.isArray(sources) && sources.length > 0,
        message: "At least one source is required.",
      },
    },
    submittedById: { type: Schema.Types.ObjectId, required: false, ref: "User" },
    submittedPseudonym: { type: String, required: true, default: "Kenya Corruption Archives Desk" },
    status: {
      type: String,
      required: true,
      enum: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "published",
        "archived",
      ],
      default: "submitted",
      index: true,
    },
    reviewedBy: { type: String, required: false },
    approvedBy: { type: String, required: false },
    rejectedReason: { type: String, required: false, maxlength: 500 },
    moderationNotes: { type: String, required: false, maxlength: 2000 },
    publishedAt: { type: Date, required: false, index: true },
    year: { type: Number, required: true, index: true },
    isBreaking: { type: Boolean, required: true, default: false, index: true },
    isFeatured: { type: Boolean, required: true, default: false, index: true },
    isSponsored: { type: Boolean, required: true, default: false },
    views: { type: Number, required: true, default: 0, min: 0 },
    likes: { type: Number, required: true, default: 0, min: 0 },
    commentsCount: { type: Number, required: true, default: 0, min: 0 },
    readingTime: { type: Number, required: true, default: 1, min: 1 },
  },
  { timestamps: true }
);

ArticleSchema.index({ title: "text", excerpt: "text", content: "text", tags: "text" });
ArticleSchema.index({ status: 1, publishedAt: -1 });
ArticleSchema.index({ year: 1, status: 1 });
ArticleSchema.index({ category: 1, status: 1, publishedAt: -1 });
ArticleSchema.index({ tags: 1, status: 1, publishedAt: -1 });
ArticleSchema.index({ isBreaking: 1, publishedAt: -1 });
ArticleSchema.index({ isFeatured: 1, publishedAt: -1 });

ArticleSchema.pre("validate", function (next) {
  if (!this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  if (!this.year) {
    const baseDate = this.publishedAt ?? new Date();
    this.year = baseDate.getUTCFullYear();
  }
  if (this.isModified("content")) {
    const words = this.content.trim().split(/\s+/).length;
    this.readingTime = Math.max(1, Math.ceil(words / 200));
  }
  next();
});

export type ArticleDocument = InferSchemaType<typeof ArticleSchema> & {
  submittedById: Types.ObjectId;
};
export const ArticleModel = model("Article", ArticleSchema);
