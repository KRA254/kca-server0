import { Types } from "mongoose";
import { PollVoteModel } from "../models/pollVote";
import { CorruptPersonModel } from "../models/corruptPerson";
import { WeeklyPollModel } from "../models/weeklyPoll";

type PollDoc = Record<string, any>;
type PollOption = {
  id: string;
  label: string;
  description?: string;
  personId?: string;
  imageUrl?: string;
  votes: number;
};
type VoteCountItem = {
  optionId?: string | null;
  personId?: Types.ObjectId | null;
};

export const serializePoll = async (poll: PollDoc) => {
  const freshPoll = await WeeklyPollModel.findById(poll._id).lean();
  if (freshPoll) poll = freshPoll;

  const personIds: string[] = (poll.personIds ?? []).map((id: { toString: () => string }) =>
    id.toString()
  );
  const optionPersonIds = (poll.options ?? [])
    .map((option: { personId?: { toString: () => string } }) => option.personId?.toString())
    .filter(Boolean);
  const allPersonIds = [...new Set([...personIds, ...optionPersonIds])];
  const voteDocs = await PollVoteModel.find({ pollId: new Types.ObjectId(poll._id) })
    .select("optionId personId")
    .lean<VoteCountItem[]>();
  const countMap = voteDocs.reduce<Map<string, number>>((map, vote) => {
    const key = vote.optionId ?? vote.personId?.toString();
    if (!key) return map;
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
  const persons = await CorruptPersonModel.find({ _id: { $in: allPersonIds } }).lean();
  const personMap = new Map(persons.map((person) => [person._id.toString(), person]));
  const storedOptions = [...new Map(
    [...(poll.options ?? [])]
      .sort((a: { sortOrder?: number }, b: { sortOrder?: number }) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((option: any, index) => {
        const optionId = option.optionId ?? option.personId?.toString?.() ?? `option-${index + 1}`;
        return [optionId, {
          ...option,
          optionId,
          votes: Number(option.votes ?? 0),
        }];
      })
  ).values()].sort(
    (a: { sortOrder?: number }, b: { sortOrder?: number }) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
  const options: PollOption[] = storedOptions.length
    ? storedOptions.map((option: any) => {
        const personId = option.personId?.toString();
        const person = personId ? personMap.get(personId) : undefined;
        const id = option.optionId;
        return {
          id,
          label: option.label ?? person?.fullName ?? id,
          description: option.description,
          personId,
          imageUrl: option.imageUrl ?? person?.photoUrl ?? undefined,
          votes: (option.votes ?? 0) + (countMap.get(id) ?? 0),
        };
      })
    : personIds.map((id: string) => {
        const person = personMap.get(id);
        return {
          id,
          label: person?.fullName ?? id,
          personId: id,
          imageUrl: person?.photoUrl ?? undefined,
          votes: countMap.get(id) ?? 0,
        };
      });
  const totalVotes = options.reduce((sum: number, option: PollOption) => sum + option.votes, 0);
  const rankings = [...options]
    .sort((a, b) => b.votes - a.votes)
    .map((option, index) => ({
      ...option,
      rank: index + 1,
      percent: totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0,
    }));

  return {
    id: poll._id.toString(),
    question: poll.question,
    kind: poll.kind ?? (storedOptions.length ? "custom" : "profiles"),
    status: poll.status,
    options,
    totalVotes,
    rankings,
    weekStart: poll.weekStart?.toISOString?.() ?? poll.weekStart,
    endsAt: poll.weekEnd?.toISOString?.() ?? poll.weekEnd,
    resultOptionId: poll.resultOptionId,
    resultPersonId: poll.resultPersonId?.toString?.() ?? poll.resultPersonId,
  };
};
