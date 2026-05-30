import { Schema, model, type InferSchemaType } from "mongoose";

const WeeklyPollSchema = new Schema(
  {
    question: { type: String, required: true, maxlength: 200 },
    weekStart: { type: Date, required: true, index: true },
    weekEnd: { type: Date, required: true, index: true },
    status: { type: String, required: true, enum: ["open", "closed", "processing"], index: true },
    personIds: { type: [Schema.Types.ObjectId], required: true, ref: "CorruptPerson" },
    totalVotes: { type: Number, required: true, default: 0, min: 0 },
    resultPersonId: { type: Schema.Types.ObjectId, required: false, ref: "CorruptPerson" },
    createdBy: { type: Schema.Types.ObjectId, required: false, ref: "Admin" },
  },
  { timestamps: true }
);

WeeklyPollSchema.index({ weekStart: -1, status: 1 });
WeeklyPollSchema.index({ status: 1, weekEnd: -1 });

export type WeeklyPollDocument = InferSchemaType<typeof WeeklyPollSchema>;
export const WeeklyPollModel = model("WeeklyPoll", WeeklyPollSchema);
