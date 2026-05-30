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

const StalledProjectSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 220 },
    slug: { type: String, required: true, unique: true, index: true },
    imageUrl: { type: String, required: false },
    description: { type: String, required: false, maxlength: 2000 },
    details: { type: String, required: false, maxlength: 12000 },
    county: { type: String, required: false, maxlength: 120, index: true },
    sector: { type: String, required: true, maxlength: 80, index: true },
    status: {
      type: String,
      required: true,
      enum: ["stalled", "abandoned", "delayed", "under_review", "completed", "in_progress", "failed", "unknown"],
      default: "stalled",
      index: true,
    },
    budgetedAmount: { type: Number, required: true, default: 0, min: 0 },
    amountPaid: { type: Number, required: true, default: 0, min: 0 },
    estimatedLoss: { type: Number, required: true, default: 0, min: 0 },
    currency: { type: String, required: true, default: "KES", maxlength: 8 },
    contractor: { type: String, required: false, maxlength: 180 },
    tenderAwardedTo: { type: String, required: false, maxlength: 180 },
    engineer: { type: String, required: false, maxlength: 180 },
    personResponsibleName: { type: String, required: false, maxlength: 180 },
    procurementMethod: { type: String, required: false, maxlength: 120 },
    fundingSource: { type: String, required: false, maxlength: 160 },
    completionPercent: { type: Number, required: true, default: 0, min: 0, max: 100 },
    personInChargeId: { type: Schema.Types.ObjectId, required: false, ref: "CorruptPerson", index: true },
    caseIds: { type: [Schema.Types.ObjectId], required: true, default: [], ref: "CorruptionCase", index: true },
    submittedById: { type: Schema.Types.ObjectId, required: false, ref: "User" },
    submittedPseudonym: { type: String, required: false, maxlength: 64 },
    moderationStatus: {
      type: String,
      required: true,
      enum: ["submitted", "under_review", "approved", "rejected"],
      default: "approved",
      index: true,
    },
    reviewedBy: { type: String, required: false },
    rejectedReason: { type: String, required: false, maxlength: 500 },
    moderationNotes: { type: String, required: false, maxlength: 2000 },
    startDate: { type: Date, required: false },
    expectedCompletionDate: { type: Date, required: false },
    lastVerifiedAt: { type: Date, required: false },
    sources: { type: [SourceSchema], required: true, default: [] },
  },
  { timestamps: true }
);

StalledProjectSchema.index({ status: 1, estimatedLoss: -1 });
StalledProjectSchema.index({ moderationStatus: 1, status: 1, estimatedLoss: -1 });
StalledProjectSchema.index({ sector: 1, status: 1 });
StalledProjectSchema.index({ name: "text", description: "text", contractor: "text", county: "text" });

StalledProjectSchema.pre("validate", function (next) {
  if (!this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export type StalledProjectDocument = InferSchemaType<typeof StalledProjectSchema> & {
  personInChargeId?: Types.ObjectId;
  caseIds: Types.ObjectId[];
};
export const StalledProjectModel = model("StalledProject", StalledProjectSchema);
