import { Worker } from "bullmq";
import sharp from "sharp";
import { redis } from "../../lib/redis";

export const imageWorker = new Worker(
  "image-optimization",
  async (job) => {
    const { inputPath, outputPath, width } = job.data as {
      inputPath: string;
      outputPath: string;
      width?: number;
    };
    const pipeline = sharp(inputPath).rotate().withMetadata();
    if (width) {
      pipeline.resize({ width });
    }
    await pipeline.toFile(outputPath);
    return { outputPath };
  },
  { connection: redis }
);
