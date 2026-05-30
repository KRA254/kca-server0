import { Hono } from "hono";
import { z } from "zod";
import { validateBody } from "../../middleware/validate";
import { TickerItemModel } from "../../../models/tickerItem";
import { logAdminAction } from "../../../services/adminAuditService";

const tickerSchema = z.object({
  articleId: z.string().optional(),
  slug: z.string().min(1),
  title: z.string().min(2),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

const audit = async (c: any, action: string, targetId: string, metadata: Record<string, unknown>) => {
  const adminWallet = c.get("adminWallet") as string;
  await logAdminAction({
    adminWallet,
    action,
    targetType: "tickerItem",
    targetId,
    metadata,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "",
    userAgent: c.req.header("user-agent") ?? "",
  });
};

export const adminTickerRouter = new Hono();

adminTickerRouter.get("/", async (c) => {
  const items = await TickerItemModel.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
  return c.json({ items });
});

adminTickerRouter.post("/", validateBody(tickerSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof tickerSchema>;
  const item = await TickerItemModel.create(body);
  await audit(c, "ticker.create", item._id.toString(), body);
  return c.json({ item }, 201);
});

adminTickerRouter.patch("/:itemId", validateBody(tickerSchema.partial()), async (c) => {
  const body = c.get("validatedBody") as Partial<z.infer<typeof tickerSchema>>;
  const item = await TickerItemModel.findByIdAndUpdate(c.req.param("itemId"), body, {
    new: true,
    runValidators: true,
  });
  if (!item) return c.json({ error: "Not found" }, 404);
  await audit(c, "ticker.update", c.req.param("itemId"), body);
  return c.json({ item });
});

adminTickerRouter.delete("/:itemId", async (c) => {
  const item = await TickerItemModel.findByIdAndDelete(c.req.param("itemId"));
  if (!item) return c.json({ error: "Not found" }, 404);
  await audit(c, "ticker.delete", c.req.param("itemId"), {});
  return c.json({ ok: true });
});
