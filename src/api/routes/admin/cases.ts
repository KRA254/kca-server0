import { Hono } from "hono";
import { z } from "zod";
import { validateBody } from "../../middleware/validate";
import { CorruptionCaseModel } from "../../../models/corruptionCase";
import { submitCase } from "../../../services/caseService";
import { logAdminAction } from "../../../services/adminAuditService";

const sourceSchema = z.object({
  title: z.string().min(2),
  url: z.string().url(),
  description: z.string().optional(),
  type: z.string().min(2),
});

const linkedPersonSchema = z.object({
  personId: z.string().min(1),
  name: z.string().min(2),
  slug: z.string().optional(),
  role: z.string().optional(),
  caseRole: z.string().optional(),
  outcome: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

const caseSchema = z.object({
  articleId: z.string().min(1),
  personId: z.string().min(1),
  linkedPersons: z.array(linkedPersonSchema).default([]),
  title: z.string().min(2).optional(),
  severityScore: z.number().min(1).max(10),
  description: z.string().min(10),
  amountInvolved: z.number().optional(),
  amountLost: z.number().min(0).optional(),
  amountRecovered: z.number().min(0).optional(),
  amountCurrency: z.string().min(3).max(8).optional(),
  amountStatus: z.enum(["alleged", "audited", "charged", "recovered", "court_awarded", "unknown"]).optional(),
  caseStatus: z.string().min(2),
  sources: z.array(sourceSchema).min(1),
});

const audit = async (c: any, action: string, targetId: string, metadata: Record<string, unknown>) => {
  const adminWallet = c.get("adminWallet") as string;
  await logAdminAction({
    adminWallet,
    action,
    targetType: "case",
    targetId,
    metadata,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "",
    userAgent: c.req.header("user-agent") ?? "",
  });
};

export const adminCasesRouter = new Hono();

adminCasesRouter.get("/", async (c) => {
  const items = await CorruptionCaseModel.find().sort({ createdAt: -1 }).limit(100).lean();
  return c.json({ items });
});

adminCasesRouter.get("/:caseId", async (c) => {
  const item = await CorruptionCaseModel.findById(c.req.param("caseId")).lean();
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json({ case: item });
});

adminCasesRouter.post("/", validateBody(caseSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof caseSchema>;
  const item = await submitCase(body);
  await audit(c, "case.create", item._id.toString(), body);
  return c.json({ case: item }, 201);
});

adminCasesRouter.patch("/:caseId", validateBody(caseSchema.partial()), async (c) => {
  const body = c.get("validatedBody") as Partial<z.infer<typeof caseSchema>>;
  const item = await CorruptionCaseModel.findByIdAndUpdate(c.req.param("caseId"), body, {
    new: true,
    runValidators: true,
  });
  if (!item) return c.json({ error: "Not found" }, 404);
  await audit(c, "case.update", c.req.param("caseId"), body);
  return c.json({ case: item });
});

adminCasesRouter.delete("/:caseId", async (c) => {
  const item = await CorruptionCaseModel.findByIdAndDelete(c.req.param("caseId"));
  if (!item) return c.json({ error: "Not found" }, 404);
  await audit(c, "case.delete", c.req.param("caseId"), {});
  return c.json({ ok: true });
});
