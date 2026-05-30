import { Hono } from "hono";
import { z } from "zod";
import { validateBody } from "../../middleware/validate";
import { WeeklyPollModel } from "../../../models/weeklyPoll";
import { closePoll, listPolls, updatePoll } from "../../../services/pollService";
import { logAdminAction } from "../../../services/adminAuditService";

const pollSchema = z.object({
  question: z.string().min(5),
  weekStart: z.string().datetime(),
  weekEnd: z.string().datetime(),
  personIds: z.array(z.string()).min(1),
});

const pollPatchSchema = z.object({
  question: z.string().min(5).optional(),
  weekStart: z.string().datetime().optional(),
  weekEnd: z.string().datetime().optional(),
  personIds: z.array(z.string()).min(1).optional(),
  status: z.enum(["open", "closed", "processing"]).optional(),
});

const closeSchema = z.object({
  resultPersonId: z.string().min(1),
  totalVotes: z.number().min(0).default(0),
});

const audit = async (c: any, action: string, targetId: string, metadata: Record<string, unknown>) => {
  const adminWallet = c.get("adminWallet") as string;
  await logAdminAction({
    adminWallet,
    action,
    targetType: "poll",
    targetId,
    metadata,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "",
    userAgent: c.req.header("user-agent") ?? "",
  });
};

export const adminPollsRouter = new Hono();

adminPollsRouter.get("/", async (c) => {
  const polls = await listPolls();
  return c.json({ items: polls });
});

adminPollsRouter.post("/", validateBody(pollSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof pollSchema>;
  const poll = await WeeklyPollModel.create({
    question: body.question,
    weekStart: new Date(body.weekStart),
    weekEnd: new Date(body.weekEnd),
    status: "open",
    personIds: body.personIds,
  });
  await audit(c, "poll.create", poll._id.toString(), body);
  return c.json({ poll }, 201);
});

adminPollsRouter.patch("/:pollId", validateBody(pollPatchSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof pollPatchSchema>;
  const poll = await updatePoll(c.req.param("pollId"), {
    ...body,
    weekStart: body.weekStart ? new Date(body.weekStart) : undefined,
    weekEnd: body.weekEnd ? new Date(body.weekEnd) : undefined,
  });
  if (!poll) return c.json({ error: "Not found" }, 404);
  await audit(c, "poll.update", c.req.param("pollId"), body);
  return c.json({ poll });
});

adminPollsRouter.post("/:pollId/close", validateBody(closeSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof closeSchema>;
  const poll = await closePoll(c.req.param("pollId"), body.resultPersonId, body.totalVotes);
  if (!poll) return c.json({ error: "Not found" }, 404);
  await audit(c, "poll.close", c.req.param("pollId"), body);
  return c.json({ poll });
});

adminPollsRouter.delete("/:pollId", async (c) => {
  const poll = await WeeklyPollModel.findByIdAndDelete(c.req.param("pollId"));
  if (!poll) return c.json({ error: "Not found" }, 404);
  await audit(c, "poll.delete", c.req.param("pollId"), {});
  return c.json({ ok: true });
});
