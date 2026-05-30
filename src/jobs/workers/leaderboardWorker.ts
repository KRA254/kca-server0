import { Worker } from "bullmq";
import { redis } from "../../lib/redis";
import { recomputeLeaderboardRanks } from "../../services/leaderboardService";

export const leaderboardWorker = new Worker(
  "leaderboard-recalc",
  async () => {
    const updated = await recomputeLeaderboardRanks();
    return { updated };
  },
  { connection: redis }
);
