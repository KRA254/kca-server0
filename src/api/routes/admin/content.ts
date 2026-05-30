import { Hono } from "hono";
import { z } from "zod";
import { validateBody } from "../../middleware/validate";
import { ContentBlockModel, ContentPageModel, SiteConfigModel } from "../../../models/content";
import { logAdminAction } from "../../../services/adminAuditService";

const blockSchema = z.object({
  key: z.string().min(2),
  title: z.string().optional(),
  body: z.string().min(1),
});

const sectionSchema = z.object({
  heading: z.string().min(2),
  body: z.string().min(1),
});

const pageSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(2),
  kicker: z.string().optional(),
  sections: z.array(sectionSchema).default([]),
});

const navLinkSchema = z.object({
  to: z.string().min(1),
  label: z.string().min(1),
});

const siteSchema = z.object({
  brand: z.object({
    name: z.string().min(1),
    tagline: z.string().optional(),
    logoText: z.string().optional(),
  }),
  nav: z.array(navLinkSchema).default([]),
  footer: z.object({
    about: z.string().optional(),
    sections: z.array(z.object({
      title: z.string().min(1),
      links: z.array(navLinkSchema).default([]),
    })).default([]),
    tipLine: z.string().optional(),
  }),
});

const audit = async (
  c: any,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown>
) => {
  const adminWallet = c.get("adminWallet") as string;
  await logAdminAction({
    adminWallet,
    action,
    targetType,
    targetId,
    metadata,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "",
    userAgent: c.req.header("user-agent") ?? "",
  });
};

export const adminContentRouter = new Hono();

adminContentRouter.get("/blocks", async (c) => {
  const items = await ContentBlockModel.find().sort({ key: 1 }).lean();
  return c.json({ items });
});

adminContentRouter.post("/blocks", validateBody(blockSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof blockSchema>;
  const block = await ContentBlockModel.create(body);
  await audit(c, "contentBlock.create", "contentBlock", block._id.toString(), body);
  return c.json({ block }, 201);
});

adminContentRouter.patch("/blocks/:blockId", validateBody(blockSchema.partial()), async (c) => {
  const body = c.get("validatedBody") as Partial<z.infer<typeof blockSchema>>;
  const block = await ContentBlockModel.findByIdAndUpdate(c.req.param("blockId"), body, {
    new: true,
    runValidators: true,
  });
  if (!block) return c.json({ error: "Not found" }, 404);
  await audit(c, "contentBlock.update", "contentBlock", c.req.param("blockId"), body);
  return c.json({ block });
});

adminContentRouter.delete("/blocks/:blockId", async (c) => {
  const block = await ContentBlockModel.findByIdAndDelete(c.req.param("blockId"));
  if (!block) return c.json({ error: "Not found" }, 404);
  await audit(c, "contentBlock.delete", "contentBlock", c.req.param("blockId"), {});
  return c.json({ ok: true });
});

adminContentRouter.get("/pages", async (c) => {
  const items = await ContentPageModel.find().sort({ slug: 1 }).lean();
  return c.json({ items });
});

adminContentRouter.post("/pages", validateBody(pageSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof pageSchema>;
  const page = await ContentPageModel.create(body);
  await audit(c, "contentPage.create", "contentPage", page._id.toString(), body);
  return c.json({ page }, 201);
});

adminContentRouter.patch("/pages/:pageId", validateBody(pageSchema.partial()), async (c) => {
  const body = c.get("validatedBody") as Partial<z.infer<typeof pageSchema>>;
  const page = await ContentPageModel.findByIdAndUpdate(c.req.param("pageId"), body, {
    new: true,
    runValidators: true,
  });
  if (!page) return c.json({ error: "Not found" }, 404);
  await audit(c, "contentPage.update", "contentPage", c.req.param("pageId"), body);
  return c.json({ page });
});

adminContentRouter.delete("/pages/:pageId", async (c) => {
  const page = await ContentPageModel.findByIdAndDelete(c.req.param("pageId"));
  if (!page) return c.json({ error: "Not found" }, 404);
  await audit(c, "contentPage.delete", "contentPage", c.req.param("pageId"), {});
  return c.json({ ok: true });
});

adminContentRouter.get("/site", async (c) => {
  const site = await SiteConfigModel.findOne({ key: "default" }).lean();
  return c.json({ site });
});

adminContentRouter.put("/site", validateBody(siteSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof siteSchema>;
  const site = await SiteConfigModel.findOneAndUpdate(
    { key: "default" },
    { ...body, key: "default" },
    { new: true, upsert: true, runValidators: true }
  );
  await audit(c, "siteConfig.update", "siteConfig", site._id.toString(), body);
  return c.json({ site });
});
