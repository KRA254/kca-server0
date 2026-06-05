import { Hono } from "hono";
import { z } from "zod";
import { pollVoteRateLimitMiddleware } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";
import { WeeklyPollModel } from "../../models/weeklyPoll";
import { resolveUser } from "../../services/userService";
import { getCurrentPoll, submitVote } from "../../services/pollService";
import { serializePoll } from "../../services/pollPresenter";
import { hashValue } from "../../utils/hash";

const voteSchema = z.object({
  optionId: z.string().optional(),
  personId: z.string().optional(),
  userId: z.string().optional(),
  pseudonym: z.string().optional(),
});

export const pollsRouter = new Hono();

pollsRouter.get("/current", async (c) => {
  c.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  c.header("Pragma", "no-cache");
  c.header("Expires", "0");
  const poll = await getCurrentPoll();
  if (!poll) {
    return c.json(null);
  }
  return c.json(await serializePoll(poll));
});

pollsRouter.post("/:pollId/votes", pollVoteRateLimitMiddleware, validateBody(voteSchema), async (c) => {
  c.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  const body = c.get("validatedBody") as z.infer<typeof voteSchema>;
  const optionId = body.optionId ?? body.personId;
  if (!optionId) {
    return c.json({ error: "optionId is required" }, 400);
  }
  const poll = await WeeklyPollModel.findById(c.req.param("pollId")).lean();
  if (!poll || poll.status !== "open") return c.json({ error: "Poll is not open" }, 404);

  const option = (poll.options ?? []).find((item: any) => item.optionId === optionId);
  const legacyPersonIds = (poll.personIds ?? []).map((id: { toString: () => string }) => id.toString());
  if (!option && !legacyPersonIds.includes(optionId)) {
    return c.json({ error: "Unknown poll option" }, 400);
  }

  const user = await resolveUser({ userId: body.userId, pseudonym: body.pseudonym });
  const ip = c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "anonymous";
  try {
    await submitVote({
      pollId: c.req.param("pollId"),
      optionId,
      personId: option?.personId?.toString?.() ?? (legacyPersonIds.includes(optionId) ? optionId : undefined),
      voterId: user._id.toString(),
      voterPseudonym: user.pseudonym,
      ipHash: hashValue(ip),
    });
  } catch (error) {
    const mongoError = error as { code?: number };
    if (mongoError.code !== 11000) throw error;
  }

  const freshPoll = await WeeklyPollModel.findById(c.req.param("pollId")).lean();
  if (!freshPoll) return c.json(null, 404);
  return c.json(await serializePoll(freshPoll));
});
