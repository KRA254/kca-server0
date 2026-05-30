import { Schema, model, type InferSchemaType } from "mongoose";

const EvidenceItemSchema = new Schema(
  {
    type: { type: String, required: true, maxlength: 60 },
    label: { type: String, required: true, maxlength: 180 },
    status: { type: String, required: true, maxlength: 60, default: "VERIFIED" },
    url: { type: String, required: false },
    sortOrder: { type: Number, required: true, default: 0, index: true },
    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: true }
);

EvidenceItemSchema.index({ isActive: 1, sortOrder: 1, createdAt: -1 });

export type EvidenceItemDocument = InferSchemaType<typeof EvidenceItemSchema>;
export const EvidenceItemModel = model("EvidenceItem", EvidenceItemSchema);
