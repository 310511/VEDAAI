import express from "express";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { initSocket } from "./socket/io";
import assignmentRoutes from "./routes/assignments";
import { Worker } from "bullmq";
import { redisConnection } from "./config/redis";
import { GENERATION_QUEUE_NAME } from "./queue/generationQueue";
import {
  GenerationJobData,
  processGenerationJob,
} from "./workers/processGeneration";

const app = express();
const httpServer = createServer(app);

initSocket(httpServer);

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/assignments", assignmentRoutes);

const generationWorker = new Worker<GenerationJobData>(
  GENERATION_QUEUE_NAME,
  processGenerationJob,
  { connection: redisConnection, concurrency: 2 }
);

generationWorker.on("failed", (job, err) => {
  console.error(`Generation job ${job?.id} failed:`, err.message);
});

async function start(): Promise<void> {
  await connectDB();
  httpServer.listen(env.port, () => {
    console.log(`VedaAI API running on http://localhost:${env.port}`);
    console.log("BullMQ worker embedded in API process");
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
