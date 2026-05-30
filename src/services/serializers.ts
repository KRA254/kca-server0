type AnyDoc = Record<string, any>;

export const toId = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toString" in value) {
    return value.toString();
  }
  return String(value);
};

export const serializeArticle = (article: AnyDoc) => ({
  id: toId(article._id ?? article.id),
  slug: article.slug,
  title: article.title,
  deck: article.subtitle ?? "",
  summary: article.excerpt ?? "",
  body: article.content ?? "",
  category: article.category,
  tags: article.tags ?? [],
  author: article.author ?? article.submittedPseudonym ?? "Kenya Corruption Archives Desk",
  publishedAt: article.publishedAt?.toISOString?.() ?? article.publishedAt ?? article.createdAt,
  year: article.year,
  readTime: article.readingTime ?? 1,
  imageUrl: article.featuredImage,
  sources: article.sources ?? [],
  verified: article.status === "published" || article.status === "approved",
  keyFinding: article.keyFinding,
  views: article.views ?? 0,
});

export const serializePerson = (person: AnyDoc, index?: number) => ({
  id: toId(person._id ?? person.id),
  slug: person.slug,
  name: person.fullName,
  role: person.position ?? "",
  bio: person.bio ?? "",
  imageUrl: person.photoUrl ?? "",
  score: person.totalScore ?? 0,
  trend: person.trend ?? 0,
  caseCount: person.totalCases ?? 0,
  totalAmountLinked: person.totalAmountLinked ?? 0,
  totalAmountRecovered: person.totalAmountRecovered ?? 0,
  amountCurrency: person.amountCurrency ?? "KES",
  profileVisibility: person.profileVisibility ?? "public",
  rank: person.rank ?? (typeof index === "number" ? index + 1 : undefined),
});

export const serializeCase = (item: AnyDoc) => ({
  id: toId(item._id ?? item.id),
  title: item.title ?? item.caseStatus ?? "Corruption case",
  status: item.caseStatus,
  date: item.createdAt?.toISOString?.().slice(0, 10) ?? item.createdAt,
  summary: item.description,
  amountInvolved: item.amountInvolved ?? item.amountLost ?? 0,
  amountLost: item.amountLost ?? item.amountInvolved ?? 0,
  amountRecovered: item.amountRecovered ?? 0,
  amountCurrency: item.amountCurrency ?? "KES",
  amountStatus: item.amountStatus ?? "unknown",
  linkedPersons: (item.linkedPersons ?? []).map((person: AnyDoc) => ({
    id: toId(person.personId ?? person.id),
    name: person.name,
    slug: person.slug ?? "",
    role: person.role ?? "",
    caseRole: person.caseRole ?? "",
    outcome: person.outcome ?? "",
    isPrimary: person.isPrimary ?? false,
  })),
});

export const serializeStalledProject = (project: AnyDoc) => ({
  id: toId(project._id ?? project.id),
  slug: project.slug,
  name: project.name,
  imageUrl: project.imageUrl ?? "",
  description: project.description ?? "",
  details: project.details ?? "",
  county: project.county ?? "",
  sector: project.sector,
  status: project.status,
  budgetedAmount: project.budgetedAmount ?? 0,
  amountPaid: project.amountPaid ?? 0,
  estimatedLoss: project.estimatedLoss ?? 0,
  currency: project.currency ?? "KES",
  contractor: project.contractor ?? "",
  tenderAwardedTo: project.tenderAwardedTo ?? project.contractor ?? "",
  engineer: project.engineer ?? "",
  personResponsibleName: project.personResponsibleName ?? "",
  procurementMethod: project.procurementMethod ?? "",
  fundingSource: project.fundingSource ?? "",
  completionPercent: project.completionPercent ?? 0,
  personInChargeId: toId(project.personInChargeId),
  caseIds: (project.caseIds ?? []).map(toId),
  startDate: project.startDate?.toISOString?.() ?? project.startDate,
  expectedCompletionDate: project.expectedCompletionDate?.toISOString?.() ?? project.expectedCompletionDate,
  lastVerifiedAt: project.lastVerifiedAt?.toISOString?.() ?? project.lastVerifiedAt,
  sources: project.sources ?? [],
});

export const serializeComment = (comment: AnyDoc) => ({
  id: toId(comment._id ?? comment.id),
  author: comment.authorPseudonym,
  body: comment.content,
  createdAt: comment.createdAt?.toISOString?.() ?? comment.createdAt,
  status: comment.status,
  replies: [],
});
