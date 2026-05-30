import { Schema, model, type InferSchemaType } from "mongoose";

const TickerItemSchema = new Schema(
  {
    articleId: { type: Schema.Types.ObjectId, required: false, ref: "Article", index: true },
    slug: { type: String, required: true, index: true },
    title: { type: String, required: true, maxlength: 220 },
    sortOrder: { type: Number, required: true, default: 0, index: true },
    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: true }
);

TickerItemSchema.index({ isActive: 1, sortOrder: 1, createdAt: -1 });

export type TickerItemDocument = InferSchemaType<typeof TickerItemSchema>;
export const TickerItemModel = model("TickerItem", TickerItemSchema);
