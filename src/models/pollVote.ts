import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const PollVoteSchema = new Schema(
  {
    pollId: { type: Schema.Types.ObjectId, required: true, ref: "WeeklyPoll", index: true },
    optionId: { type: String, required: false, index: true },
    personId: { type: Schema.Types.ObjectId, required: false, ref: "CorruptPerson", index: true },
    voterId: { type: Schema.Types.ObjectId, required: false, ref: "User" },
    voterPseudonym: { type: String, required: true },
    ipHash: { type: String, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PollVoteSchema.index({ pollId: 1, voterId: 1 }, { unique: true, sparse: true });
PollVoteSchema.index({ pollId: 1, ipHash: 1 }, { unique: true });
PollVoteSchema.index({ pollId: 1, optionId: 1 });
PollVoteSchema.index({ pollId: 1, personId: 1 });

export type PollVoteDocument = InferSchemaType<typeof PollVoteSchema> & {
  pollId: Types.ObjectId;
  personId?: Types.ObjectId;
};
export const PollVoteModel = model("PollVote", PollVoteSchema);
