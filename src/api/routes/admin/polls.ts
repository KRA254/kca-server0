import { Hono } from "hono";
import { z } from "zod";
import { validateBody } from "../../middleware/validate";
import { WeeklyPollModel } from "../../../models/weeklyPoll";
import { closePoll, listPollVotes, listPolls, updatePoll } from "../../../services/pollService";
import { logAdminAction } from "../../../services/adminAuditService";

const pollOptionSchema = z.object({
  optionId: z.string().min(1).optional(),
  label: z.string().min(1).max(160),
  description: z.string().max(500).optional(),
  personId: z.string().optional(),
  imageUrl: z.string().optional(),
  votes: z.number().min(0).default(0),
  sortOrder: z.number().default(0),
});

const pollSchema = z.object({
  question: z.string().min(5),
  weekStart: z.string().datetime(),
  weekEnd: z.string().datetime(),
  kind: z.enum(["profiles", "custom"]).default("custom"),
  personIds: z.array(z.string()).default([]),
  options: z.array(pollOptionSchema).min(1).optional(),
  status: z.enum(["open", "closed", "processing"]).default("open"),
});

const pollPatchSchema = z.object({
  question: z.string().min(5).optional(),
  weekStart: z.string().datetime().optional(),
  weekEnd: z.string().datetime().optional(),
  kind: z.enum(["profiles", "custom"]).optional(),
  personIds: z.array(z.string()).optional(),
  options: z.array(pollOptionSchema).min(1).optional(),
  totalVotes: z.number().min(0).optional(),
  resultOptionId: z.string().optional(),
  resultPersonId: z.string().optional(),
  status: z.enum(["open", "closed", "processing"]).optional(),
});

const closeSchema = z.object({
  resultOptionId: z.string().min(1),
  resultPersonId: z.string().optional(),
  totalVotes: z.number().min(0).optional(),
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

const slugOptionId = (label: string, index: number) =>
  `${label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "option"}-${index + 1}`;

const normalizeOptions = (body: { options?: z.infer<typeof pollOptionSchema>[]; personIds?: string[] }) => {
  if (body.options?.length) {
    return body.options.map((option, index) => ({
      ...option,
      optionId: option.optionId || option.personId || slugOptionId(option.label, index),
      sortOrder: option.sortOrder ?? index,
      votes: option.votes ?? 0,
    }));
  }
  return (body.personIds ?? []).map((personId, index) => ({
    optionId: personId,
    label: personId,
    personId,
    votes: 0,
    sortOrder: index,
  }));
};

adminPollsRouter.get("/", async (c) => {
  const polls = await listPolls();
  return c.json({ items: polls });
});

adminPollsRouter.post("/", validateBody(pollSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof pollSchema>;
  const options = normalizeOptions(body);
  const poll = await WeeklyPollModel.create({
    question: body.question,
    weekStart: new Date(body.weekStart),
    weekEnd: new Date(body.weekEnd),
    status: body.status,
    kind: body.kind,
    personIds: body.personIds,
    options,
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
    options: body.options ? normalizeOptions(body) : undefined,
  });
  if (!poll) return c.json({ error: "Not found" }, 404);
  await audit(c, "poll.update", c.req.param("pollId"), body);
  return c.json({ poll });
});

adminPollsRouter.get("/:pollId/votes", async (c) => {
  const votes = await listPollVotes(c.req.param("pollId"));
  const counts = votes.reduce<Record<string, number>>((acc, vote: any) => {
    const key = vote.optionId ?? vote.personId?.toString?.() ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return c.json({ items: votes, counts });
});

adminPollsRouter.post("/:pollId/close", validateBody(closeSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof closeSchema>;
  const poll = await closePoll(c.req.param("pollId"), body);
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
