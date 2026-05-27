export interface GeneratedPaperResponse {
  metadata: {
    subject: string;
    grade: string;
    school: string;
    timeAllowed: string;
    maxMarks: number;
  };
  sections: {
    title: string;
    instruction: string;
    questions: {
      text: string;
      difficulty: "Easy" | "Moderate" | "Hard";
      marks: number;
    }[];
  }[];
  answerKey: { questionNumber: number; answer: string }[];
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in Gemini response");
  return match[0];
}

function repairTruncatedJson(json: string): string {
  let s = json.trim();

  if (!s.endsWith("}")) {
    const lastComplete = s.lastIndexOf('"},');
    if (lastComplete > 0) {
      s = s.slice(0, lastComplete + 2);
    }
    const openBraces = (s.match(/\{/g) || []).length;
    const closeBraces = (s.match(/\}/g) || []).length;
    const openBrackets = (s.match(/\[/g) || []).length;
    const closeBrackets = (s.match(/\]/g) || []).length;
    s += "]".repeat(Math.max(0, openBrackets - closeBrackets));
    s += "}".repeat(Math.max(0, openBraces - closeBraces));
  }

  return s;
}

function validatePaper(data: unknown): GeneratedPaperResponse {
  const parsed = data as Record<string, unknown>;
  const sections = parsed?.sections as unknown[] | undefined;
  if (!sections?.length) {
    throw new Error("Invalid paper structure from Gemini: missing sections");
  }
  return data as GeneratedPaperResponse;
}

export function parsePaperJson(text: string): GeneratedPaperResponse {
  const raw = extractJson(text);

  try {
    return validatePaper(JSON.parse(raw));
  } catch (firstError) {
    try {
      return validatePaper(JSON.parse(repairTruncatedJson(raw)));
    } catch {
      const message =
        firstError instanceof Error ? firstError.message : "Invalid JSON from Gemini";
      if (message.includes("Unterminated") || message.includes("JSON")) {
        throw new Error(
          "AI response was truncated or invalid JSON. Use fewer questions per type, then regenerate."
        );
      }
      throw firstError;
    }
  }
}
