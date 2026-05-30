import pino from "pino";
import { config } from "../config";

const prettyTransport =
  config.logPretty || config.nodeEnv !== "production"
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          singleLine: true,
          ignore: "pid,hostname",
        },
      }
    : undefined;

export const logger = pino({
  level: config.logLevel,
  base: { service: "the-expose" },
  redact: ["req.headers.authorization"],
  transport: prettyTransport,
});
