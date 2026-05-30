import { CorruptionCaseModel } from "../models/corruptionCase";
import { CorruptPersonModel } from "../models/corruptPerson";
import { recomputeLeaderboardRanks } from "./leaderboardService";

export const listPersons = async (limit = 50, offset = 0, includeLinkedOnly = false) => {
  await recomputeLeaderboardRanks();
  return CorruptPersonModel.find(includeLinkedOnly ? {} : { profileVisibility: { $ne: "linked_only" } })
    .sort({ rank: 1, totalAmountLinked: -1, totalScore: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
};

export const getPersonBySlug = async (slug: string) =>
  CorruptPersonModel.findOne({ slug }).lean();

export const syncPersonProfileVisibility = async () => {
  const primaryIds = await CorruptionCaseModel.distinct("personId");
  await CorruptPersonModel.updateMany(
    { _id: { $in: primaryIds } },
    { $set: { profileVisibility: "public" } }
  );
  await CorruptPersonModel.updateMany(
    { _id: { $nin: primaryIds } },
    { $set: { profileVisibility: "linked_only" } }
  );
};

export const createPerson = async (payload: {
  fullName: string;
  nationality: string;
  position?: string;
  bio?: string;
  photoUrl?: string;
  totalCases?: number;
  totalScore?: number;
  totalAmountLinked?: number;
  totalAmountRecovered?: number;
  amountCurrency?: string;
  rank?: number;
  profileVisibility?: "public" | "linked_only";
}) => CorruptPersonModel.create(payload);

export const updatePerson = async (
  personId: string,
  payload: Partial<{
    fullName: string;
    nationality: string;
    position: string;
    bio: string;
    photoUrl: string;
    totalCases: number;
    totalScore: number;
    totalAmountLinked: number;
    totalAmountRecovered: number;
    amountCurrency: string;
    rank: number;
    profileVisibility: "public" | "linked_only";
  }>
) => CorruptPersonModel.findByIdAndUpdate(personId, payload, { new: true, runValidators: true });

export const deletePerson = async (personId: string) =>
  CorruptPersonModel.findByIdAndDelete(personId);
