import { Hono } from "hono";
import { z } from "zod";
import { validateBody } from "../middleware/validate";
import { resolveUser, touchUserActivity } from "../../services/userService";
import { listComments, submitComment } from "../../services/commentService";
import { serializeComment } from "../../services/serializers";

const sourceSchema = z.object({
  title: z.string().min(2),
  url: z.string().url(),
  description: z.string().optional(),
  type: z.string().min(2),
});

const commentSchema = z.object({
  author: z.string().trim().min(2, "Name must be at least 2 characters").max(64).optional(),
  body: z.string().optional(),
  content: z.string().optional(),
  parentCommentId: z.string().optional(),
  sources: z.array(sourceSchema).default([]),
  userId: z.string().optional(),
  pseudonym: z.string().trim().min(2, "Name must be at least 2 characters").max(64).optional(),
  password: z.string().min(8).optional(),
});

export const commentsRouter = new Hono();

commentsRouter.get("/articles/:articleId", async (c) => {
  const comments = await listComments(c.req.param("articleId"));
  return c.json(comments.map(serializeComment));
});

commentsRouter.post("/articles/:articleId", validateBody(commentSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof commentSchema>;
  const content = body.body ?? body.content;
  if (!content || content.length < 3) {
    return c.json({
      status: 400,
      message: "Comment body must be at least 3 characters.",
      code: "VALIDATION_ERROR",
      details: { body: "Comment body must be at least 3 characters." },
    }, 400);
  }
  const displayName = (body.pseudonym ?? body.author ?? "").trim();
  if (displayName && displayName.length < 2) {
    return c.json({
      status: 400,
      message: "Display name must be at least 2 characters.",
      code: "VALIDATION_ERROR",
      details: { author: "Display name must be at least 2 characters." },
    }, 400);
  }
  const user = await resolveUser({
    userId: body.userId,
    pseudonym: displayName || undefined,
    password: body.password,
  });
  await touchUserActivity(user._id.toString());

  const comment = await submitComment({
    articleId: c.req.param("articleId"),
    parentCommentId: body.parentCommentId,
    content,
    authorId: user._id.toString(),
    authorPseudonym: displayName || user.pseudonym,
    sources: body.sources.length > 0 ? body.sources : [{ title: "Reader comment", url: "https://example.com", type: "Comment" }],
  });

  return c.json(serializeComment(comment), 201);
});
