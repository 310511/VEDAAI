import type { IAssignment } from "./models/Assignment";
import type { GeneratedPaperResponse } from "./geminiService";
import { formatGeminiError, generatePaperWithGemini } from "./geminiService";
import { formatGrokError, generatePaperWithGrok } from "./grokService";

type Provider = "gemini" | "grok";

function provider(): Provider {
  const p = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (p === "grok" || p === "xai") return "grok";
  return "gemini";
}

export function formatAiError(error: unknown): string {
  return provider() === "grok" ? formatGrokError(error) : formatGeminiError(error);
}

export async function generatePaper(
  assignment: IAssignment
): Promise<GeneratedPaperResponse> {
  if (provider() === "grok") return generatePaperWithGrok(assignment);
  return generatePaperWithGemini(assignment);
}

