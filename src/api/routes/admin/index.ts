import { Hono } from "hono";
import { adminArticlesRouter } from "./articles";
import { adminCommentsRouter } from "./comments";
import { adminPersonsRouter } from "./persons";
import { adminCasesRouter } from "./cases";
import { adminPollsRouter } from "./polls";
import { adminAnalyticsRouter } from "./analytics";
import { adminContentRouter } from "./content";
import { adminEvidenceRouter } from "./evidence";
import { adminTickerRouter } from "./ticker";
import { adminProjectsRouter } from "./projects";
import { createSiweNonce, verifySiweMessage } from "../../../services/siweService";
import { config } from "../../../config";
import jwt from "jsonwebtoken";
import { adminAuthMiddleware } from "../../middleware/adminAuth";
import { clearRuntimeCache } from "../../../services/cacheAdminService";
import { logAdminAction } from "../../../services/adminAuditService";

export const adminRouter = new Hono();

adminRouter.post("/auth/siwe/nonce", async (c) => {
  const nonce = await createSiweNonce();
  return c.json({ nonce });
});

adminRouter.post("/auth/siwe/verify", async (c) => {
  const body = await c.req.json();
  const { message, signature, nonce } = body as {
    message: string;
    signature: string;
    nonce: string;
  };
  const result = await verifySiweMessage({ message, signature, nonce });
  const wallet = result.data.address.toLowerCase();
  if (config.adminWalletAllowlist.length > 0 && !config.adminWalletAllowlist.includes(wallet)) {
    return c.json({ error: "Wallet not authorized" }, 403);
  }
  const token = jwt.sign({ wallet }, config.jwtSecret, {
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
    expiresIn: config.jwtExpiresInSeconds,
  });
  return c.json({ token, wallet });
});

adminRouter.use("*", adminAuthMiddleware);

adminRouter.post("/cache/clear", async (c) => {
  const result = await clearRuntimeCache();
  await logAdminAction({
    adminWallet: c.get("adminWallet") as string,
    action: "cache.clear",
    targetType: "runtimeCache",
    metadata: result,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "",
    userAgent: c.req.header("user-agent") ?? "",
  });
  return c.json(result);
});

adminRouter.route("/articles", adminArticlesRouter);
adminRouter.route("/comments", adminCommentsRouter);
adminRouter.route("/persons", adminPersonsRouter);
adminRouter.route("/cases", adminCasesRouter);
adminRouter.route("/polls", adminPollsRouter);
adminRouter.route("/projects", adminProjectsRouter);
adminRouter.route("/analytics", adminAnalyticsRouter);
adminRouter.route("/content", adminContentRouter);
adminRouter.route("/evidence", adminEvidenceRouter);
adminRouter.route("/ticker", adminTickerRouter);
