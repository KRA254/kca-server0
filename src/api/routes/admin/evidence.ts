import { Hono } from "hono";
import { z } from "zod";
import { validateBody } from "../../middleware/validate";
import { EvidenceItemModel } from "../../../models/evidenceItem";
import { logAdminAction } from "../../../services/adminAuditService";

const evidenceSchema = z.object({
  type: z.string().min(2),
  label: z.string().min(2),
  status: z.string().min(2).default("VERIFIED"),
  url: z.string().url().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

const audit = async (c: any, action: string, targetId: string, metadata: Record<string, unknown>) => {
  const adminWallet = c.get("adminWallet") as string;
  await logAdminAction({
    adminWallet,
    action,
    targetType: "evidenceItem",
    targetId,
    metadata,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "",
    userAgent: c.req.header("user-agent") ?? "",
  });
};

export const adminEvidenceRouter = new Hono();

adminEvidenceRouter.get("/", async (c) => {
  const items = await EvidenceItemModel.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
  return c.json({ items });
});

adminEvidenceRouter.post("/", validateBody(evidenceSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof evidenceSchema>;
  const item = await EvidenceItemModel.create(body);
  await audit(c, "evidence.create", item._id.toString(), body);
  return c.json({ item }, 201);
});

adminEvidenceRouter.patch("/:itemId", validateBody(evidenceSchema.partial()), async (c) => {
  const body = c.get("validatedBody") as Partial<z.infer<typeof evidenceSchema>>;
  const item = await EvidenceItemModel.findByIdAndUpdate(c.req.param("itemId"), body, {
    new: true,
    runValidators: true,
  });
  if (!item) return c.json({ error: "Not found" }, 404);
  await audit(c, "evidence.update", c.req.param("itemId"), body);
  return c.json({ item });
});

adminEvidenceRouter.delete("/:itemId", async (c) => {
  const item = await EvidenceItemModel.findByIdAndDelete(c.req.param("itemId"));
  if (!item) return c.json({ error: "Not found" }, 404);
  await audit(c, "evidence.delete", c.req.param("itemId"), {});
  return c.json({ ok: true });
});
