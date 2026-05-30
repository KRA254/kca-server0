import { Hono } from "hono";
import { z } from "zod";
import { validateBody } from "../../middleware/validate";
import { CommentModel } from "../../../models/comment";
import { reviewComment } from "../../../services/commentService";
import { logAdminAction } from "../../../services/adminAuditService";

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export const adminCommentsRouter = new Hono();

adminCommentsRouter.get("/", async (c) => {
  const status = c.req.query("status") ?? "pending";
  const items = await CommentModel.find({ status }).sort({ createdAt: -1 }).limit(100).lean();
  return c.json({ items });
});

adminCommentsRouter.post("/:commentId/review", validateBody(reviewSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof reviewSchema>;
  const adminWallet = c.get("adminWallet") as string;
  const updated = await reviewComment({
    commentId: c.req.param("commentId"),
    status: body.status,
  });
  await logAdminAction({
    adminWallet,
    action: "comment.review",
    targetType: "comment",
    targetId: c.req.param("commentId"),
    metadata: body,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "",
    userAgent: c.req.header("user-agent") ?? "",
  });
  return c.json({ comment: updated });
});

adminCommentsRouter.delete("/:commentId", async (c) => {
  const adminWallet = c.get("adminWallet") as string;
  const comment = await CommentModel.findByIdAndDelete(c.req.param("commentId"));
  if (!comment) return c.json({ error: "Not found" }, 404);
  await logAdminAction({
    adminWallet,
    action: "comment.delete",
    targetType: "comment",
    targetId: c.req.param("commentId"),
    metadata: { articleId: comment.articleId?.toString(), status: comment.status },
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "",
    userAgent: c.req.header("user-agent") ?? "",
  });
  return c.json({ ok: true });
});
