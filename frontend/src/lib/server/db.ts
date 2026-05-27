import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/vedaai";
const LOG_TIMINGS =
  process.env.LOG_TIMINGS === "1" || process.env.NODE_ENV === "production";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const start = Date.now();
    cached.promise = mongoose
      .connect(uri, { bufferCommands: false })
      .finally(() => {
        if (LOG_TIMINGS) {
          console.log(`[VedaAI][timing] mongoose.connect ${Date.now() - start}ms`);
        }
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
