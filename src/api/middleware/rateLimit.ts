import { RateLimiterRedis } from "rate-limiter-flexible";
import { createMiddleware } from "hono/factory";
import { redis } from "../../lib/redis";
import { config } from "../../config";

const limiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rlflx",
  points: config.rateLimitPoints,
  duration: config.rateLimitDuration,
  blockDuration: config.rateLimitBlock,
});

const submissionLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "public-submissions",
  points: config.submissionRateLimitPoints,
  duration: config.submissionRateLimitDuration,
  blockDuration: config.submissionRateLimitBlock,
});

const uploadLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "public-uploads",
  points: config.uploadRateLimitPoints,
  duration: config.uploadRateLimitDuration,
  blockDuration: config.uploadRateLimitBlock,
});

const pollVoteLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "poll-votes",
  points: config.pollVoteRateLimitPoints,
  duration: config.pollVoteRateLimitDuration,
  blockDuration: config.pollVoteRateLimitBlock,
});

const clientKey = (c: any) => {
  const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded ?? c.req.header("x-real-ip") ?? "anonymous";
};

const isRateLimitRejection = (error: any) => typeof error?.msBeforeNext === "number";

export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    await next();
    return;
  }

  const key = clientKey(c);
  try {
    await limiter.consume(key);
  } catch (error: any) {
    if (!isRateLimitRejection(error)) {
      await next();
      return;
    }
    const retryAfter = Math.max(1, Math.ceil((error?.msBeforeNext ?? 1000) / 1000));
    c.header("Retry-After", String(retryAfter));
    return c.json({
      status: 429,
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      code: "RATE_LIMITED",
      retryAfter,
    }, 429);
  }
  await next();
});

export const publicSubmissionRateLimitMiddleware = createMiddleware(async (c, next) => {
  const key = clientKey(c);
  try {
    await submissionLimiter.consume(key);
  } catch (error: any) {
    if (!isRateLimitRejection(error)) {
      await next();
      return;
    }
    const retryAfter = Math.max(1, Math.ceil((error?.msBeforeNext ?? 1000) / 1000));
    c.header("Retry-After", String(retryAfter));
    return c.json({
      status: 429,
      message: "Too many public submissions from this network. Please try again later.",
      code: "PUBLIC_SUBMISSION_RATE_LIMITED",
      retryAfter,
    }, 429);
  }
  await next();
});

export const publicUploadRateLimitMiddleware = createMiddleware(async (c, next) => {
  const key = clientKey(c);
  try {
    await uploadLimiter.consume(key);
  } catch (error: any) {
    if (!isRateLimitRejection(error)) {
      await next();
      return;
    }
    const retryAfter = Math.max(1, Math.ceil((error?.msBeforeNext ?? 1000) / 1000));
    c.header("Retry-After", String(retryAfter));
    return c.json({
      status: 429,
      message: "Too many image uploads from this network. Please try again later.",
      code: "PUBLIC_UPLOAD_RATE_LIMITED",
      retryAfter,
    }, 429);
  }
  await next();
});

export const pollVoteRateLimitMiddleware = createMiddleware(async (c, next) => {
  const key = clientKey(c);
  try {
    await pollVoteLimiter.consume(key);
  } catch (error: any) {
    if (!isRateLimitRejection(error)) {
      await next();
      return;
    }
    const retryAfter = Math.max(1, Math.ceil((error?.msBeforeNext ?? 1000) / 1000));
    c.header("Retry-After", String(retryAfter));
    return c.json({
      status: 429,
      message: "Too many poll vote attempts from this network. Please try again later.",
      code: "POLL_VOTE_RATE_LIMITED",
      retryAfter,
    }, 429);
  }
  await next();
});
