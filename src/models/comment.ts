import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const SourceSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 120 },
    url: { type: String, required: true },
    description: { type: String, required: false, maxlength: 500 },
    type: { type: String, required: true, maxlength: 40 },
  },
  { _id: false }
);

const CommentSchema = new Schema(
  {
    articleId: { type: Schema.Types.ObjectId, required: true, ref: "Article", index: true },
    parentCommentId: { type: Schema.Types.ObjectId, required: false, ref: "Comment" },
    content: { type: String, required: true, maxlength: 2000 },
    authorId: { type: Schema.Types.ObjectId, required: false, ref: "User" },
    authorPseudonym: { type: String, required: true },
    status: { type: String, required: true, enum: ["pending", "approved", "rejected"], index: true },
    sources: {
      type: [SourceSchema],
      required: true,
      validate: {
        validator: (sources: unknown[]) => Array.isArray(sources) && sources.length > 0,
        message: "At least one source is required.",
      },
    },
    likes: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CommentSchema.index({ articleId: 1, parentCommentId: 1, createdAt: -1 });
CommentSchema.index({ status: 1, createdAt: -1 });

export type CommentDocument = InferSchemaType<typeof CommentSchema> & {
  articleId: Types.ObjectId;
  parentCommentId?: Types.ObjectId;
};
export const CommentModel = model("Comment", CommentSchema);
