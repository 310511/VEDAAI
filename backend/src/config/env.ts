import dotenv from "dotenv";

dotenv.config();

export const env = {
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/vedaai",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  port: parseInt(process.env.PORT || "4000", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};
