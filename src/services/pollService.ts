import { Types } from "mongoose";
import { WeeklyPollModel } from "../models/weeklyPoll";
import { PollVoteModel } from "../models/pollVote";

export const getCurrentPoll = async () =>
  WeeklyPollModel.findOne({ status: "open" }).sort({ weekStart: -1 }).lean();

export const submitVote = async (payload: {
  pollId: string;
  personId: string;
  voterId?: string | Types.ObjectId;
  voterPseudonym: string;
  ipHash: string;
}) => PollVoteModel.create(payload);

export const closePoll = async (pollId: string, resultPersonId: string, totalVotes: number) =>
  WeeklyPollModel.findByIdAndUpdate(
    pollId,
    { status: "closed", resultPersonId, totalVotes },
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
    personIds: string[];
  }>
) => WeeklyPollModel.findByIdAndUpdate(pollId, payload, { new: true, runValidators: true });
