import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { corsMiddleware } from "./middleware/cors";
import { requestIdMiddleware } from "./middleware/requestId";
import { loggerMiddleware } from "./middleware/logger";
import { rateLimitMiddleware } from "./middleware/rateLimit";
import { userAuthMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";
import { publicRouter } from "./routes/public";
import { articlesRouter } from "./routes/articles";
import { corruptionCasesRouter } from "./routes/corruptionCases";
import { commentsRouter } from "./routes/comments";
import { personsRouter } from "./routes/persons";
import { leaderboardRouter } from "./routes/leaderboard";
import { pollsRouter } from "./routes/polls";
import { casesRouter } from "./routes/cases";
import { tickerRouter } from "./routes/ticker";
import { evidenceRouter } from "./routes/evidence";
import { contentRouter } from "./routes/content";
import { analyticsRouter } from "./routes/analytics";
import { projectsRouter } from "./routes/projects";
import { uploadsRouter } from "./routes/uploads";
import { adminRouter } from "./routes/admin";

export const app = new Hono();

app.use("*", corsMiddleware);
app.use("*", requestIdMiddleware);
app.use("*", loggerMiddleware);
app.use("*", rateLimitMiddleware);
app.use("*", userAuthMiddleware);
app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("x-frame-options", "DENY");
});

app.use("*", secureHeaders());

app.route("/", publicRouter);
app.route("/articles", articlesRouter);
app.route("/corruption-cases", corruptionCasesRouter);
app.route("/comments", commentsRouter);
app.route("/persons", personsRouter);
app.route("/cases", casesRouter);
app.route("/leaderboard", leaderboardRouter);
app.route("/polls", pollsRouter);
app.route("/ticker", tickerRouter);
app.route("/evidence", evidenceRouter);
app.route("/content", contentRouter);
app.route("/analytics", analyticsRouter);
app.route("/projects", projectsRouter);
app.route("/uploads", uploadsRouter);
app.route("/admin", adminRouter);

app.onError(errorHandler);
