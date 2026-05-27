import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const GENERATION_QUEUE_NAME = "paper-generation";

export const generationQueue = new Queue(GENERATION_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export async function enqueueGeneration(assignmentId: string): Promise<void> {
  await generationQueue.add(
    "generate-paper",
    { assignmentId },
    { jobId: `gen-${assignmentId}` }
  );
}
