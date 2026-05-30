import { serve } from "@hono/node-server";
import { app } from "./api";
import { connectDatabase } from "./lib/db";
import { logger } from "./lib/logger";
import { config } from "./config";

const start = async () => {
  await connectDatabase();
  serve({ fetch: app.fetch, port: config.port });
  logger.info(`Server running on port ${config.port}`);
};

start().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
