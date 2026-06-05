import { Hono } from "hono";
import { z } from "zod";
import { validateBody } from "../../middleware/validate";
import { StalledProjectModel } from "../../../models/stalledProject";
import { logAdminAction } from "../../../services/adminAuditService";

const sourceSchema = z.object({
  title: z.string().optional().default(""),
  url: z.string().optional().default(""),
  description: z.string().optional(),
  type: z.string().optional().default("Source"),
});

const stalledProjectSchema = z.object({
  name: z.string().max(220).optional().or(z.literal("")),
  slug: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
  details: z.string().optional(),
  county: z.string().optional(),
  sector: z.string().optional().default("Unknown"),
  status: z.enum(["stalled", "abandoned", "delayed", "under_review", "completed", "in_progress", "failed", "unknown"]).default("stalled"),
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
  submittedPseudonym: z.string().optional(),
  moderationStatus: z.enum(["submitted", "under_review", "approved", "rejected"]).default("approved"),
  rejectedReason: z.string().optional(),
  moderationNotes: z.string().optional(),
  startDate: z.string().datetime().optional(),
  expectedCompletionDate: z.string().datetime().optional(),
  lastVerifiedAt: z.string().datetime().optional(),
  sources: z.array(sourceSchema).default([]),
});

const normalizeDates = <T extends {
  startDate?: string;
  expectedCompletionDate?: string;
  lastVerifiedAt?: string;
}>(body: T) => ({
  ...body,
  startDate: body.startDate ? new Date(body.startDate) : undefined,
  expectedCompletionDate: body.expectedCompletionDate ? new Date(body.expectedCompletionDate) : undefined,
  lastVerifiedAt: body.lastVerifiedAt ? new Date(body.lastVerifiedAt) : undefined,
});

const textOr = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

const normalizeProjectPayload = (body: z.infer<typeof stalledProjectSchema> | Partial<z.infer<typeof stalledProjectSchema>>) => {
  const fallbackText = textOr(body.details, textOr(body.description, "Project record awaiting completion."));
  return normalizeDates({
    ...body,
    name: body.name === undefined ? undefined : textOr(body.name, fallbackText.slice(0, 90)),
    sector: body.sector === undefined ? undefined : textOr(body.sector, "Unknown"),
    description: body.description === undefined ? undefined : textOr(body.description, fallbackText.slice(0, 500)),
    imageUrl: body.imageUrl?.trim() ?? body.imageUrl,
    sources: body.sources?.filter((source) => source.title || source.url) ?? body.sources,
  });
};

const normalizeNewProjectPayload = (body: z.infer<typeof stalledProjectSchema>) =>
  normalizeProjectPayload({
    ...body,
    name: body.name ?? "",
    sector: body.sector ?? "Unknown",
    description: body.description ?? "",
    imageUrl: body.imageUrl ?? "",
    sources: body.sources ?? [],
  });

const audit = async (c: any, action: string, targetId: string, metadata: Record<string, unknown>) => {
  const adminWallet = c.get("adminWallet") as string;
  await logAdminAction({
    adminWallet,
    action,
    targetType: "stalledProject",
    targetId,
    metadata,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "",
    userAgent: c.req.header("user-agent") ?? "",
  });
};

const reviewSchema = z.object({
  moderationStatus: z.enum(["under_review", "approved", "rejected"]),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const adminProjectsRouter = new Hono();

adminProjectsRouter.get("/", async (c) => {
  const items = await StalledProjectModel.find().sort({ estimatedLoss: -1, updatedAt: -1 }).limit(100).lean();
  return c.json({ items });
});
adminProjectsRouter.get("/stalled", async (c) => {
  const items = await StalledProjectModel.find().sort({ estimatedLoss: -1, updatedAt: -1 }).limit(100).lean();
  return c.json({ items });
});

adminProjectsRouter.get("/stalled/:projectId", async (c) => {
  const project = await StalledProjectModel.findById(c.req.param("projectId")).lean();
  if (!project) return c.json({ error: "Not found" }, 404);
  return c.json({ project });
});

adminProjectsRouter.post("/stalled", validateBody(stalledProjectSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof stalledProjectSchema>;
  const project = await StalledProjectModel.create(normalizeNewProjectPayload(body));
  await audit(c, "stalledProject.create", project._id.toString(), body);
  return c.json({ project }, 201);
});
adminProjectsRouter.post("/", validateBody(stalledProjectSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof stalledProjectSchema>;
  const project = await StalledProjectModel.create(normalizeNewProjectPayload(body));
  await audit(c, "project.create", project._id.toString(), body);
  return c.json({ project }, 201);
});

adminProjectsRouter.patch("/stalled/:projectId", validateBody(stalledProjectSchema.partial()), async (c) => {
  const body = c.get("validatedBody") as Partial<z.infer<typeof stalledProjectSchema>>;
  const project = await StalledProjectModel.findByIdAndUpdate(
    c.req.param("projectId"),
    normalizeProjectPayload(body),
    { new: true, runValidators: true }
  );
  if (!project) return c.json({ error: "Not found" }, 404);
  await audit(c, "stalledProject.update", c.req.param("projectId"), body);
  return c.json({ project });
});
adminProjectsRouter.patch("/:projectId", validateBody(stalledProjectSchema.partial()), async (c) => {
  const body = c.get("validatedBody") as Partial<z.infer<typeof stalledProjectSchema>>;
  const project = await StalledProjectModel.findByIdAndUpdate(
    c.req.param("projectId"),
    normalizeProjectPayload(body),
    { new: true, runValidators: true }
  );
  if (!project) return c.json({ error: "Not found" }, 404);
  await audit(c, "project.update", c.req.param("projectId"), body);
  return c.json({ project });
});

adminProjectsRouter.post("/:projectId/review", validateBody(reviewSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof reviewSchema>;
  const adminWallet = c.get("adminWallet") as string;
  const project = await StalledProjectModel.findByIdAndUpdate(
    c.req.param("projectId"),
    {
      moderationStatus: body.moderationStatus,
      reviewedBy: adminWallet,
      rejectedReason: body.moderationStatus === "rejected" ? body.reason ?? "" : undefined,
      moderationNotes: body.notes,
    },
    { new: true, runValidators: true }
  );
  if (!project) return c.json({ error: "Not found" }, 404);
  await audit(c, "project.review", c.req.param("projectId"), body);
  return c.json({ project });
});

adminProjectsRouter.delete("/stalled/:projectId", async (c) => {
  const project = await StalledProjectModel.findByIdAndDelete(c.req.param("projectId"));
  if (!project) return c.json({ error: "Not found" }, 404);
  await audit(c, "stalledProject.delete", c.req.param("projectId"), {});
  return c.json({ ok: true });
});
adminProjectsRouter.delete("/:projectId", async (c) => {
  const project = await StalledProjectModel.findByIdAndDelete(c.req.param("projectId"));
  if (!project) return c.json({ error: "Not found" }, 404);
  await audit(c, "project.delete", c.req.param("projectId"), {});
  return c.json({ ok: true });
});
