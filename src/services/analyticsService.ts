import { CorruptionCaseModel } from "../models/corruptionCase";
import { CorruptPersonModel } from "../models/corruptPerson";
import { StalledProjectModel } from "../models/stalledProject";

export const getMoneyAnalytics = async () => {
  const [caseTotals, topPersons, topCases, projectTotals] = await Promise.all([
    CorruptionCaseModel.aggregate([
      {
        $group: {
          _id: "$amountCurrency",
          totalAmountInvolved: { $sum: { $ifNull: ["$amountInvolved", 0] } },
          totalAmountLost: { $sum: { $ifNull: ["$amountLost", "$amountInvolved"] } },
          totalAmountRecovered: { $sum: { $ifNull: ["$amountRecovered", 0] } },
          caseCount: { $sum: 1 },
        },
      },
    ]),
    CorruptPersonModel.find({ profileVisibility: { $ne: "linked_only" } }).sort({ totalAmountLinked: -1 }).limit(10).lean(),
    CorruptionCaseModel.find().sort({ amountLost: -1, amountInvolved: -1 }).limit(10).lean(),
    StalledProjectModel.aggregate([
      {
        $group: {
          _id: "$currency",
          totalBudgetedAmount: { $sum: "$budgetedAmount" },
          totalAmountPaid: { $sum: "$amountPaid" },
          totalEstimatedLoss: { $sum: "$estimatedLoss" },
          stalledProjectCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    byCurrency: caseTotals,
    stalledProjectsByCurrency: projectTotals,
    topPersons,
    topCases,
  };
};

export const getCaseAnalytics = async () => {
  const [byStatus, byCategory, byYear, severityBands, totalCases] = await Promise.all([
    CorruptionCaseModel.aggregate([{ $group: { _id: "$caseStatus", count: { $sum: 1 }, amountLost: { $sum: "$amountLost" } } }]),
    CorruptionCaseModel.aggregate([
      {
        $lookup: {
          from: "articles",
          localField: "articleId",
          foreignField: "_id",
          as: "article",
        },
      },
      { $unwind: { path: "$article", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$article.category", count: { $sum: 1 }, amountLost: { $sum: "$amountLost" } } },
      { $sort: { count: -1 } },
    ]),
    CorruptionCaseModel.aggregate([
      { $group: { _id: { $year: "$createdAt" }, count: { $sum: 1 }, amountLost: { $sum: "$amountLost" } } },
      { $sort: { _id: -1 } },
    ]),
    CorruptionCaseModel.aggregate([
      {
        $bucket: {
          groupBy: "$severityScore",
          boundaries: [1, 4, 7, 11],
          default: "unknown",
          output: { count: { $sum: 1 }, amountLost: { $sum: "$amountLost" } },
        },
      },
    ]),
    CorruptionCaseModel.countDocuments(),
  ]);

  return { totalCases, byStatus, byCategory, byYear, severityBands };
};

export const getProjectAnalytics = async () => {
  const [byStatus, bySector, topProjects, totals] = await Promise.all([
    StalledProjectModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, estimatedLoss: { $sum: "$estimatedLoss" } } }]),
    StalledProjectModel.aggregate([{ $group: { _id: "$sector", count: { $sum: 1 }, estimatedLoss: { $sum: "$estimatedLoss" } } }]),
    StalledProjectModel.find().sort({ estimatedLoss: -1 }).limit(10).lean(),
    StalledProjectModel.aggregate([
      {
        $group: {
          _id: "$currency",
          budgetedAmount: { $sum: "$budgetedAmount" },
          amountPaid: { $sum: "$amountPaid" },
          estimatedLoss: { $sum: "$estimatedLoss" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return { totals, byStatus, bySector, topProjects };
};

export const getPersonCorruptionAnalytics = async (slug?: string) => {
  const personMatch = slug ? await CorruptPersonModel.findOne({ slug }).select("_id fullName slug").lean() : null;
  if (slug && !personMatch) {
    return {
      person: null,
      curve: [],
      topPersons: [],
    };
  }

  const matchStage = personMatch ? { $match: { personId: personMatch._id } } : { $match: {} };
  const curve = await CorruptionCaseModel.aggregate([
    matchStage,
    {
      $lookup: {
        from: "articles",
        localField: "articleId",
        foreignField: "_id",
        as: "article",
      },
    },
    { $unwind: { path: "$article", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          personId: "$personId",
          year: { $ifNull: ["$article.year", { $year: "$createdAt" }] },
        },
        caseCount: { $sum: 1 },
        amountLost: { $sum: { $ifNull: ["$amountLost", 0] } },
        amountInvolved: { $sum: { $ifNull: ["$amountInvolved", 0] } },
        averageSeverity: { $avg: "$severityScore" },
      },
    },
    {
      $lookup: {
        from: "corruptpeople",
        localField: "_id.personId",
        foreignField: "_id",
        as: "person",
      },
    },
    { $unwind: "$person" },
    {
      $project: {
        _id: 0,
        personId: { $toString: "$_id.personId" },
        slug: "$person.slug",
        name: "$person.fullName",
        year: "$_id.year",
        caseCount: 1,
        amountLost: 1,
        amountInvolved: 1,
        averageSeverity: { $round: ["$averageSeverity", 2] },
      },
    },
    { $sort: { year: 1, amountLost: -1 } },
  ]);

  const leaderboard = await CorruptPersonModel.find({ profileVisibility: { $ne: "linked_only" } })
    .sort({ totalAmountLinked: -1, totalScore: -1 })
    .limit(20)
    .lean();

  return {
    person: personMatch ? { id: personMatch._id.toString(), slug: personMatch.slug, name: personMatch.fullName } : null,
    curve,
    topPersons: leaderboard,
  };
};
