import { Queue } from "bullmq";
import { redis } from "../../lib/redis";

export const pollQueue = new Queue("weekly-poll", { connection: redis });
