import { Types } from "mongoose";
import { PollVoteModel } from "../models/pollVote";
import { CorruptPersonModel } from "../models/corruptPerson";

type PollDoc = Record<string, any>;
type PollOption = { id: string; label: string; votes: number };

export const serializePoll = async (poll: PollDoc) => {
  const personIds: string[] = (poll.personIds ?? []).map((id: { toString: () => string }) =>
    id.toString()
  );
  const counts = await PollVoteModel.aggregate<{ _id: Types.ObjectId; votes: number }>([
    { $match: { pollId: new Types.ObjectId(poll._id) } },
    { $group: { _id: "$personId", votes: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((entry) => [entry._id.toString(), entry.votes]));
  const persons = await CorruptPersonModel.find({ _id: { $in: personIds } }).lean();
  const labelMap = new Map(persons.map((person) => [person._id.toString(), person.fullName]));
  const options: PollOption[] = personIds.map((id: string) => ({
    id,
    label: labelMap.get(id) ?? id,
    votes: countMap.get(id) ?? 0,
  }));
  const totalVotes = options.reduce((sum: number, option: PollOption) => sum + option.votes, 0);

  return {
    id: poll._id.toString(),
    question: poll.question,
    options,
    totalVotes,
    endsAt: poll.weekEnd?.toISOString?.() ?? poll.weekEnd,
  };
};
