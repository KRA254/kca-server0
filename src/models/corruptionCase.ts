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

const LinkedPersonSchema = new Schema(
  {
    personId: { type: Schema.Types.ObjectId, required: true, ref: "CorruptPerson" },
    name: { type: String, required: true, maxlength: 160 },
    slug: { type: String, required: false, maxlength: 180 },
    role: { type: String, required: false, maxlength: 220 },
    caseRole: { type: String, required: false, maxlength: 220 },
    outcome: { type: String, required: false, maxlength: 220 },
    isPrimary: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const CorruptionCaseSchema = new Schema(
  {
    articleId: { type: Schema.Types.ObjectId, required: true, ref: "Article", index: true },
    personId: { type: Schema.Types.ObjectId, required: true, ref: "CorruptPerson", index: true },
    linkedPersons: { type: [LinkedPersonSchema], required: true, default: [] },
    title: { type: String, required: false, maxlength: 220 },
    severityScore: { type: Number, required: true, min: 1, max: 10 },
    description: { type: String, required: true, maxlength: 2000 },
    amountInvolved: { type: Number, required: false, min: 0 },
    amountLost: { type: Number, required: true, default: 0, min: 0 },
    amountRecovered: { type: Number, required: true, default: 0, min: 0 },
    amountCurrency: { type: String, required: true, default: "KES", maxlength: 8 },
    amountStatus: {
      type: String,
      required: true,
      enum: ["alleged", "audited", "charged", "recovered", "court_awarded", "unknown"],
      default: "alleged",
      index: true,
    },
    caseStatus: { type: String, required: true, maxlength: 80 },
    sources: {
      type: [SourceSchema],
      required: true,
      validate: {
        validator: (sources: unknown[]) => Array.isArray(sources) && sources.length > 0,
        message: "At least one source is required.",
      },
    },
  },
  { timestamps: true }
);

CorruptionCaseSchema.index({ personId: 1, severityScore: -1 });
CorruptionCaseSchema.index({ "linkedPersons.personId": 1, severityScore: -1 });
CorruptionCaseSchema.index({ articleId: 1, createdAt: -1 });
CorruptionCaseSchema.index({ amountLost: -1 });
CorruptionCaseSchema.index({ caseStatus: 1, amountLost: -1 });

export type CorruptionCaseDocument = InferSchemaType<typeof CorruptionCaseSchema> & {
  articleId: Types.ObjectId;
  personId: Types.ObjectId;
};
export const CorruptionCaseModel = model("CorruptionCase", CorruptionCaseSchema);
