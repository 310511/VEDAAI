import { Worker } from "bullmq";
import { connectDB } from "../config/db";
import { redisConnection } from "../config/redis";
import { GENERATION_QUEUE_NAME } from "../queue/generationQueue";
import { GenerationJobData, processGenerationJob } from "./processGeneration";

async function startWorker(): Promise<void> {
  await connectDB();

  const worker = new Worker<GenerationJobData>(
    GENERATION_QUEUE_NAME,
    processGenerationJob,
    { connection: redisConnection, concurrency: 2 }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  console.log(
    "Generation worker started (run API server separately for WebSocket events)"
  );
}

if (require.main === module) {
  startWorker().catch((err) => {
    console.error("Worker failed to start:", err);
    process.exit(1);
  });
}

export { startWorker };
