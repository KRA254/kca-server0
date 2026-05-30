import { Types } from "mongoose";
import { CorruptPersonModel } from "../models/corruptPerson";
import { CorruptionCaseModel } from "../models/corruptionCase";

const statusWeight: Record<string, number> = {
  recovered: 1,
  court_awarded: 0.95,
  charged: 0.75,
  audited: 0.65,
  alleged: 0.45,
  unknown: 0.25,
};

const weightedAmount = (amountLost = 0, amountInvolved = 0, amountStatus = "unknown") => {
  const amount = Math.max(amountLost, amountInvolved, 0);
  return amount * (statusWeight[amountStatus] ?? 0.25);
};

const scorePerson = (item: {
  caseCount: number;
  totalAmountLinked: number;
  weightedExposure: number;
  severityTotal: number;
  recoveredTotal: number;
}) => {
  const moneyScore = item.weightedExposure > 0 ? Math.log10(item.weightedExposure + 1) * 9 : 0;
  const severityScore = item.caseCount > 0 ? (item.severityTotal / item.caseCount) * 3 : 0;
  const caseScore = Math.min(item.caseCount, 8) * 1.5;
  const recoveryPenalty = item.totalAmountLinked > 0 ? Math.min(item.recoveredTotal / item.totalAmountLinked, 1) * 3 : 0;
  return Math.round(Math.max(0, moneyScore + severityScore + caseScore - recoveryPenalty));
};

export const recomputeLeaderboardRanks = async () => {
  const visiblePeople = await CorruptPersonModel.find({ profileVisibility: { $ne: "linked_only" } }).lean();
  const personIds = visiblePeople.map((person) => person._id);
  const cases = await CorruptionCaseModel.find({ personId: { $in: personIds } }).lean();

  const stats = new Map<
    string,
    {
      caseCount: number;
      totalAmountLinked: number;
      weightedExposure: number;
      severityTotal: number;
      recoveredTotal: number;
    }
  >();

  for (const person of visiblePeople) {
    stats.set(person._id.toString(), {
      caseCount: 0,
      totalAmountLinked: 0,
      weightedExposure: 0,
      severityTotal: 0,
      recoveredTotal: 0,
    });
  }

  for (const item of cases) {
    const key = (item.personId as Types.ObjectId).toString();
    const entry = stats.get(key);
    if (!entry) continue;
    const amountLost = item.amountLost ?? 0;
    const amountInvolved = item.amountInvolved ?? 0;
    entry.caseCount += 1;
    entry.totalAmountLinked += Math.max(amountLost, amountInvolved, 0);
    entry.weightedExposure += weightedAmount(amountLost, amountInvolved, item.amountStatus);
    entry.severityTotal += item.severityScore ?? 0;
    entry.recoveredTotal += item.amountRecovered ?? 0;
  }

  const ranked = visiblePeople
    .map((person) => {
      const entry = stats.get(person._id.toString())!;
      return {
        person,
        stats: entry,
        score: scorePerson(entry),
      };
    })
    .sort((a, b) => {
      if (b.stats.weightedExposure !== a.stats.weightedExposure) return b.stats.weightedExposure - a.stats.weightedExposure;
      if (b.stats.totalAmountLinked !== a.stats.totalAmountLinked) return b.stats.totalAmountLinked - a.stats.totalAmountLinked;
      if (b.score !== a.score) return b.score - a.score;
      return b.stats.caseCount - a.stats.caseCount;
    });

  await Promise.all(
    ranked.map((entry, index) =>
      CorruptPersonModel.findByIdAndUpdate(entry.person._id, {
        $set: {
          totalCases: entry.stats.caseCount,
          totalScore: entry.score,
          totalAmountLinked: entry.stats.totalAmountLinked,
          totalAmountRecovered: entry.stats.recoveredTotal,
          rank: index + 1,
        },
      })
    )
  );

  return ranked.length;
};

export const getLeaderboard = async (limit = 10) => {
  await recomputeLeaderboardRanks();
  return CorruptPersonModel.find({ profileVisibility: { $ne: "linked_only" } })
    .sort({ rank: 1, totalAmountLinked: -1, totalScore: -1 })
    .limit(limit)
    .lean();
};
