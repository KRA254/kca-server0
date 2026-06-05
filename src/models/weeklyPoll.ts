import { Schema, model, type InferSchemaType } from "mongoose";

const PollOptionSchema = new Schema(
  {
    optionId: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: false, trim: true, maxlength: 500 },
    personId: { type: Schema.Types.ObjectId, required: false, ref: "CorruptPerson" },
    imageUrl: { type: String, required: false, trim: true },
    votes: { type: Number, required: true, default: 0, min: 0 },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const WeeklyPollSchema = new Schema(
  {
    question: { type: String, required: true, maxlength: 200 },
    kind: { type: String, required: true, enum: ["profiles", "custom"], default: "profiles", index: true },
    weekStart: { type: Date, required: true, index: true },
    weekEnd: { type: Date, required: true, index: true },
    status: { type: String, required: true, enum: ["open", "closed", "processing"], index: true },
    personIds: { type: [Schema.Types.ObjectId], required: true, default: [], ref: "CorruptPerson" },
    options: { type: [PollOptionSchema], required: true, default: [] },
    totalVotes: { type: Number, required: true, default: 0, min: 0 },
    resultPersonId: { type: Schema.Types.ObjectId, required: false, ref: "CorruptPerson" },
    resultOptionId: { type: String, required: false, trim: true },
    createdBy: { type: Schema.Types.ObjectId, required: false, ref: "Admin" },
  },
  { timestamps: true }
);

WeeklyPollSchema.index({ weekStart: -1, status: 1 });
WeeklyPollSchema.index({ status: 1, weekEnd: -1 });

export type WeeklyPollDocument = InferSchemaType<typeof WeeklyPollSchema>;
export const WeeklyPollModel = model("WeeklyPoll", WeeklyPollSchema);
