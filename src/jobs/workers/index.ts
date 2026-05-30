import "../../config";
import { imageWorker } from "./imageWorker";
import { leaderboardWorker } from "./leaderboardWorker";
import { pollWorker } from "./pollWorker";
import { notificationWorker } from "./notificationWorker";
import { logger } from "../../lib/logger";

const workers = [imageWorker, leaderboardWorker, pollWorker, notificationWorker];

for (const worker of workers) {
  worker.on("failed", (job, err) => {
    logger.error({ err, jobId: job?.id, queue: worker.name }, "Job failed");
  });
}

logger.info("Workers running");
