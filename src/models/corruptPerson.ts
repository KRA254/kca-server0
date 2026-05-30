import { Schema, model, type InferSchemaType } from "mongoose";
import slugify from "slugify";

const CorruptPersonSchema = new Schema(
  {
    fullName: { type: String, required: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, index: true },
    photoUrl: { type: String, required: false },
    nationality: { type: String, required: true, maxlength: 80 },
    position: { type: String, required: false, maxlength: 120 },
    bio: { type: String, required: false, maxlength: 2000 },
    totalCases: { type: Number, required: true, default: 0, min: 0 },
    totalScore: { type: Number, required: true, default: 0, min: 0 },
    totalAmountLinked: { type: Number, required: true, default: 0, min: 0 },
    totalAmountRecovered: { type: Number, required: true, default: 0, min: 0 },
    amountCurrency: { type: String, required: true, default: "KES", maxlength: 8 },
    rank: { type: Number, required: false, index: true },
    profileVisibility: {
      type: String,
      required: true,
      enum: ["public", "linked_only"],
      default: "public",
      index: true,
    },
  },
  { timestamps: true }
);

CorruptPersonSchema.index({ fullName: "text", bio: "text" });
CorruptPersonSchema.index({ totalScore: -1 });
CorruptPersonSchema.index({ totalAmountLinked: -1 });
CorruptPersonSchema.index({ profileVisibility: 1, totalScore: -1 });

CorruptPersonSchema.pre("validate", function (next) {
  if (!this.slug) {
    this.slug = slugify(this.fullName, { lower: true, strict: true });
  }
  next();
});

export type CorruptPersonDocument = InferSchemaType<typeof CorruptPersonSchema>;
export const CorruptPersonModel = model("CorruptPerson", CorruptPersonSchema);
