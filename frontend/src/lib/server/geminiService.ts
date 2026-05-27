import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IAssignment } from "./models/Assignment";
import { generatePrompt } from "./generatePrompt";
import {
  parsePaperJson,
  type GeneratedPaperResponse,
} from "./parsePaperJson";

export type { GeneratedPaperResponse };

const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite",
];

const BLOCKED_MODELS = new Set(["gemini-2.0-flash"]);

function modelsToTry(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const list: string[] = [];
  if (preferred && !BLOCKED_MODELS.has(preferred)) list.push(preferred);
  for (const m of MODEL_CANDIDATES) {
    if (!list.includes(m)) list.push(m);
  }
  return list;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error: unknown): boolean {
  const err = error as { status?: number; message?: string };
  return err.status === 429 || (err.message?.includes("429") ?? false);
}

function isJsonError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("JSON") ||
    msg.includes("Unterminated") ||
    msg.includes("truncated") ||
    msg.includes("Unexpected token")
  );
}

export function formatGeminiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("validation failed") || message.includes("ValidatorError")) {
    return "Could not save generated paper. Please regenerate.";
  }
  if (message.includes("429") || message.toLowerCase().includes("quota")) {
    return "Gemini API quota exceeded. Wait 1–2 minutes or use a new API key from aistudio.google.com.";
  }
  if (message.includes("API key")) {
    return "Invalid or missing Gemini API key. Check GEMINI_API_KEY in frontend/.env.local.";
  }
  if (isJsonError(error)) {
    return message;
  }
  return message.length > 220 ? `${message.slice(0, 220)}…` : message;
}

async function generateWithModel(
  apiKey: string,
  modelName: string,
  prompt: string,
  retryForJson = false
): Promise<GeneratedPaperResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 16384,
      temperature: 0.4,
    },
  });

  const fullPrompt = retryForJson
    ? `${prompt}\n\nCRITICAL: Your last response was incomplete or invalid JSON. Return ONE complete, valid JSON object. Keep each question text under 80 words. Escape quotes inside strings. Do not truncate.`
    : prompt;

  const result = await model.generateContent(fullPrompt);
  const text = result.response.text();
  if (!text) throw new Error("No text response from Gemini");

  return parsePaperJson(text);
}

export async function generatePaperWithGemini(
  assignment: IAssignment
): Promise<GeneratedPaperResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const prompt = generatePrompt(assignment);
  const errors: string[] = [];

  for (const modelName of modelsToTry()) {
    for (let jsonRetry = 0; jsonRetry < 2; jsonRetry++) {
      try {
        console.log(
          `[VedaAI] Generating with ${modelName}${jsonRetry ? " (JSON retry)" : ""}`
        );
        return await generateWithModel(apiKey, modelName, prompt, jsonRetry > 0);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`${modelName}: ${msg.slice(0, 100)}`);

        if (isJsonError(error) && jsonRetry === 0) {
          continue;
        }
        if (isRateLimitError(error)) {
          await sleep(2000);
          break;
        }
        if (msg.includes("404") && msg.includes("models/")) {
          break;
        }
        if (isJsonError(error)) {
          break;
        }
        throw error;
      }
    }
  }

  throw new Error(errors.join(" | ") || "Gemini generation failed");
}
