import { CorruptionCaseModel } from "../models/corruptionCase";

export const submitCase = async (payload: {
  articleId: string;
  personId: string;
  linkedPersons?: Array<{
    personId: string;
    name: string;
    role?: string;
    caseRole?: string;
    outcome?: string;
    isPrimary?: boolean;
  }>;
  title?: string;
  severityScore: number;
  description: string;
  amountInvolved?: number;
  amountLost?: number;
  amountRecovered?: number;
  amountCurrency?: string;
  amountStatus?: "alleged" | "audited" | "charged" | "recovered" | "court_awarded" | "unknown";
  caseStatus: string;
  sources: unknown[];
}) => CorruptionCaseModel.create(payload);

export const listCasesForPerson = async (personId: string) =>
  CorruptionCaseModel.find({
    $or: [{ personId }, { "linkedPersons.personId": personId }],
  }).sort({ createdAt: -1 }).lean();

export const listCasesForArticle = async (articleId: string) =>
  CorruptionCaseModel.find({ articleId }).sort({ severityScore: -1, createdAt: -1 }).lean();
