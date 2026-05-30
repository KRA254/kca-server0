import { Hono } from "hono";
import { z } from "zod";
import { cacheMiddleware } from "../middleware/cache";
import { validateBody } from "../middleware/validate";
import { publicSubmissionRateLimitMiddleware } from "../middleware/rateLimit";
import { ArticleModel } from "../../models/article";
import { CorruptPersonModel } from "../../models/corruptPerson";
import { CorruptionCaseModel } from "../../models/corruptionCase";
import { StalledProjectModel } from "../../models/stalledProject";
import { resolveUser, touchUserActivity } from "../../services/userService";
import { serializeStalledProject } from "../../services/serializers";

const sourceSchema = z.object({
  title: z.string().min(2),
  url: z.string().url(),
  description: z.string().optional(),
  type: z.string().min(2),
});

const projectSubmitSchema = z.object({
  name: z.string().min(3),
  imageUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().min(20).max(2000),
  details: z.string().optional(),
  county: z.string().optional(),
  sector: z.string().min(2),
  status: z.enum(["stalled", "abandoned", "delayed", "under_review", "completed", "in_progress", "failed", "unknown"]).default("under_review"),
  budgetedAmount: z.number().min(0).default(0),
  amountPaid: z.number().min(0).default(0),
  estimatedLoss: z.number().min(0).default(0),
  currency: z.string().min(3).max(8).default("KES"),
  contractor: z.string().optional(),
  tenderAwardedTo: z.string().optional(),
  engineer: z.string().optional(),
  personResponsibleName: z.string().optional(),
  procurementMethod: z.string().optional(),
  fundingSource: z.string().optional(),
  completionPercent: z.number().min(0).max(100).optional(),
  personInChargeId: z.string().optional(),
  caseIds: z.array(z.string()).default([]),
  startDate: z.string().datetime().optional(),
  expectedCompletionDate: z.string().datetime().optional(),
  lastVerifiedAt: z.string().datetime().optional(),
  sources: z.array(sourceSchema).min(1),
  userId: z.string().optional(),
  pseudonym: z.string().optional(),
  password: z.string().min(8).optional(),
});

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const projectsRouter = new Hono();

const listProjects = async (c: any, forcedQuery: Record<string, unknown> = {}) => {
  const query: Record<string, unknown> = {
    $or: [{ moderationStatus: "approved" }, { moderationStatus: { $exists: false } }],
  };
  Object.assign(query, forcedQuery);
  if (c.req.query("status")) query.status = c.req.query("status");
  if (c.req.query("sector")) query.sector = c.req.query("sector");
  if (c.req.query("county")) query.county = c.req.query("county");
  if (c.req.query("personId")) query.personInChargeId = c.req.query("personId");
  if (c.req.query("personSlug")) {
    const person = await CorruptPersonModel.findOne({ slug: c.req.query("personSlug") }).select("_id").lean();
    if (!person) return c.json([]);
    query.personInChargeId = person._id;
  }
  if (c.req.query("caseId")) query.caseIds = c.req.query("caseId");
  if (c.req.query("caseSlug")) {
    const article = await ArticleModel.findOne({ slug: c.req.query("caseSlug") }).select("_id").lean();
    if (!article) return c.json([]);
    const corruptionCase = await CorruptionCaseModel.findOne({ articleId: article._id }).select("_id").lean();
    if (!corruptionCase) return c.json([]);
    query.caseIds = corruptionCase._id;
  }

  const items = await StalledProjectModel.find(query)
    .sort({ estimatedLoss: -1, updatedAt: -1 })
    .skip(toPositiveInt(c.req.query("offset"), 0))
    .limit(toPositiveInt(c.req.query("limit"), 50))
    .lean();
  return c.json(items.map(serializeStalledProject));
};

projectsRouter.get("/", cacheMiddleware(), async (c) => {
  return listProjects(c);
});

projectsRouter.get("/stalled", cacheMiddleware(), async (c) => {
  return listProjects(c, { status: { $in: ["stalled", "abandoned", "delayed", "under_review", "failed"] } });
});

projectsRouter.get("/stalled/:slug", cacheMiddleware(), async (c) => {
  const project = await StalledProjectModel.findOne({
    slug: c.req.param("slug"),
    $or: [{ moderationStatus: "approved" }, { moderationStatus: { $exists: false } }],
  }).lean();
  if (!project) return c.json({ error: "Not found" }, 404);
  return c.json(serializeStalledProject(project));
});

projectsRouter.post("/", publicSubmissionRateLimitMiddleware, validateBody(projectSubmitSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof projectSubmitSchema>;
  const user = await resolveUser({
    userId: body.userId,
    pseudonym: body.pseudonym,
    password: body.password,
  });
  await touchUserActivity(user._id.toString());

  const project = await StalledProjectModel.create({
    ...body,
    submittedById: user._id,
    submittedPseudonym: user.pseudonym,
    moderationStatus: "submitted",
    startDate: body.startDate ? new Date(body.startDate) : undefined,
    expectedCompletionDate: body.expectedCompletionDate ? new Date(body.expectedCompletionDate) : undefined,
    lastVerifiedAt: body.lastVerifiedAt ? new Date(body.lastVerifiedAt) : undefined,
  });

  return c.json({
    projectId: project._id,
    pseudonym: user.pseudonym,
    userId: user._id,
    moderationStatus: project.moderationStatus,
    message: "Thanks. Your project record was received and will appear after review.",
  }, 201);
});
