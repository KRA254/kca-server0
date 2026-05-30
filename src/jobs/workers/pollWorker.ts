import { Worker } from "bullmq";
import { redis } from "../../lib/redis";
import { Types } from "mongoose";
import { PollVoteModel } from "../../models/pollVote";
import { WeeklyPollModel } from "../../models/weeklyPoll";

export const pollWorker = new Worker(
  "weekly-poll",
  async (job) => {
    const { pollId } = job.data as { pollId: string };
    const pollObjectId = new Types.ObjectId(pollId);
    const tally = await PollVoteModel.aggregate([
      { $match: { pollId: pollObjectId } },
      { $group: { _id: "$personId", votes: { $sum: 1 } } },
      { $sort: { votes: -1 } },
      { $limit: 1 }
    ]);
    const winner = tally[0];
    const totalVotes = await PollVoteModel.countDocuments({ pollId });
    if (winner) {
      await WeeklyPollModel.findByIdAndUpdate(pollId, {
        status: "closed",
        resultPersonId: winner._id,
        totalVotes,
      });
    }
    return { pollId, totalVotes };
  },
  { connection: redis }
);
