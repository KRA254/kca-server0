import { Hono } from "hono";
import { z } from "zod";
import { cacheMiddleware } from "../middleware/cache";
import { pollVoteRateLimitMiddleware } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";
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

pollsRouter.get("/current", cacheMiddleware(), async (c) => {
  const poll = await getCurrentPoll();
  if (!poll) {
    return c.json(null);
  }
  return c.json(await serializePoll(poll));
});

pollsRouter.post("/:pollId/votes", pollVoteRateLimitMiddleware, validateBody(voteSchema), async (c) => {
  const body = c.get("validatedBody") as z.infer<typeof voteSchema>;
  const personId = body.optionId ?? body.personId;
  if (!personId) {
    return c.json({ error: "optionId is required" }, 400);
  }

  const user = await resolveUser({ userId: body.userId, pseudonym: body.pseudonym });
  const ip = c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "anonymous";
  try {
    await submitVote({
      pollId: c.req.param("pollId"),
      personId,
      voterId: user._id.toString(),
      voterPseudonym: user.pseudonym,
      ipHash: hashValue(ip),
    });
  } catch (error) {
    const mongoError = error as { code?: number };
    if (mongoError.code !== 11000) throw error;
  }

  const poll = await getCurrentPoll();
  if (!poll) return c.json(null, 404);
  return c.json(await serializePoll(poll));
});
