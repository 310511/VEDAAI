import type { IAssignment } from "./models/Assignment";
import { generatePrompt } from "./generatePrompt";
import { parsePaperJson, type GeneratedPaperResponse } from "./parsePaperJson";

type XaiResponse = {
  output?: Array<{
    type?: string;
    role?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  error?: { message?: string };
};

function extractOutputText(data: XaiResponse): string {
  const outputs = Array.isArray(data.output) ? data.output : [];
  for (const item of outputs) {
    if (item?.type !== "message") continue;
    const content = Array.isArray(item.content) ? item.content : [];
    for (const c of content) {
      if (c?.type === "output_text" && typeof c.text === "string" && c.text.trim()) {
        return c.text;
      }
    }
  }
  throw new Error("No text response from Grok");
}

export function formatGrokError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes("api key") || message.includes("401")) {
    return "Invalid or missing Grok API key. Check XAI_API_KEY in Vercel env.";
  }
  if (message.includes("429") || message.toLowerCase().includes("rate")) {
    return "Grok API rate limit exceeded. Wait a moment and try again.";
  }
  return message.length > 220 ? `${message.slice(0, 220)}…` : message;
}

export async function generatePaperWithGrok(
  assignment: IAssignment
): Promise<GeneratedPaperResponse> {
  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY is not set");

  const model = (process.env.GROK_MODEL || process.env.XAI_MODEL || "grok-4.3").trim();
  const prompt = generatePrompt(assignment);

  const start = Date.now();
  const res = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You generate exam papers. Always return ONE complete, valid JSON object only (no markdown).",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as XaiResponse | null;
    const msg =
      body?.error?.message ||
      (typeof (body as unknown as { message?: unknown } | null)?.message === "string"
        ? String((body as unknown as { message?: unknown }).message)
        : "") ||
      `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  const data = (await res.json()) as XaiResponse;
  const text = extractOutputText(data);

  if (process.env.LOG_TIMINGS === "1" || process.env.NODE_ENV === "production") {
    console.log(`[VedaAI][timing] grok.responses ${Date.now() - start}ms model=${model}`);
  }

  return parsePaperJson(text);
}

