import mongoose from "mongoose";
import { config } from "../config";
import { logger } from "./logger";

export const connectDatabase = async () => {
  if (!config.mongoUri) {
    throw new Error("MONGO_URI is not set");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongoUri, {
    dbName: config.mongoDbName || undefined,
  });
  logger.info("MongoDB connected");
};
