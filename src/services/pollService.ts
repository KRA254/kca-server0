import { Types } from "mongoose";
import { WeeklyPollModel } from "../models/weeklyPoll";
import { PollVoteModel } from "../models/pollVote";

export const getCurrentPoll = async () => {
  const now = new Date();
  const activeWindowPoll = await WeeklyPollModel.findOne({
    status: "open",
    weekStart: { $lte: now },
    weekEnd: { $gte: now },
  })
    .sort({ weekStart: -1, createdAt: -1, _id: -1 })
    .lean();

  if (activeWindowPoll) return activeWindowPoll;

  return WeeklyPollModel.findOne({ status: "open" })
    .sort({ weekStart: -1, createdAt: -1, _id: -1 })
    .lean();
};

export const submitVote = async (payload: {
  pollId: string;
  optionId: string;
  personId?: string;
  voterId?: string | Types.ObjectId;
  voterPseudonym: string;
  ipHash: string;
}) => PollVoteModel.create(payload);

export const closePoll = async (
  pollId: string,
  payload: { resultOptionId?: string; resultPersonId?: string; totalVotes?: number }
) =>
  WeeklyPollModel.findByIdAndUpdate(
    pollId,
    { status: "closed", ...payload },
    { new: true }
  );

export const listPolls = async (limit = 50) =>
  WeeklyPollModel.find().sort({ weekStart: -1 }).limit(limit).lean();

export const updatePoll = async (
  pollId: string,
  payload: Partial<{
    question: string;
    weekStart: Date;
    weekEnd: Date;
    status: "open" | "closed" | "processing";
    kind: "profiles" | "custom";
    personIds: string[];
    options: Array<{
      optionId: string;
      label: string;
      description?: string;
      personId?: string;
      imageUrl?: string;
      votes?: number;
      sortOrder?: number;
    }>;
    totalVotes: number;
    resultOptionId: string;
    resultPersonId: string;
  }>
) => WeeklyPollModel.findByIdAndUpdate(pollId, payload, { new: true, runValidators: true });

export const listPollVotes = async (pollId: string, limit = 200) =>
  PollVoteModel.find({ pollId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
