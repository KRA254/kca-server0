import { Queue } from "bullmq";
import { redis } from "../../lib/redis";

export const leaderboardQueue = new Queue("leaderboard-recalc", { connection: redis });
