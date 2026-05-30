import { Worker } from "bullmq";
import { redis } from "../../lib/redis";

export const notificationWorker = new Worker(
  "notifications",
  async (job) => {
    return { delivered: true, type: job.name };
  },
  { connection: redis }
);
