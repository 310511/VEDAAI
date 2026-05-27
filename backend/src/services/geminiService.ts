import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { IAssignment } from "../models/Assignment";
import { generatePrompt } from "./generatePrompt";

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

export async function generatePaperWithGemini(
  assignment: IAssignment
): Promise<GeneratedPaperResponse> {
  if (!env.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const prompt = generatePrompt(assignment);
  const genAI = new GoogleGenerativeAI(env.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: env.geminiModel,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text) {
    throw new Error("No text response from Gemini");
  }

  const jsonStr = extractJson(text);
  const parsed = JSON.parse(jsonStr) as GeneratedPaperResponse;

  if (!parsed.sections || !parsed.metadata || !parsed.answerKey) {
    throw new Error("Invalid paper structure from Gemini");
  }

  return parsed;
}
