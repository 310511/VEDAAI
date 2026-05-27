import type { Assignment, CreateAssignmentPayload, GeneratedPaper } from "@/types";

/** Same-origin on Vercel; set NEXT_PUBLIC_API_URL for separate Express backend. */
function apiBase(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  return url ?? "";
}

export async function fetchAssignments(): Promise<Assignment[]> {
  const res = await fetch(`${apiBase()}/api/assignments`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch assignments");
  return res.json();
}

export async function fetchAssignment(id: string): Promise<Assignment> {
  const res = await fetch(`${apiBase()}/api/assignments/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch assignment");
  return res.json();
}

export async function createAssignment(
  payload: CreateAssignmentPayload
): Promise<{ assignmentId: string; assignment: Assignment }> {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("subject", payload.subject);
  formData.append("grade", payload.grade);
  formData.append("school", payload.school);
  formData.append("dueDate", payload.dueDate);
  formData.append("questionTypes", JSON.stringify(payload.questionTypes));
  if (payload.additionalInstructions) {
    formData.append("additionalInstructions", payload.additionalInstructions);
  }
  if (payload.file) {
    formData.append("file", payload.file);
  }

  const res = await fetch(`${apiBase()}/api/assignments`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create assignment");
  }
  return res.json();
}

export async function deleteAssignment(id: string): Promise<void> {
  const res = await fetch(`${apiBase()}/api/assignments/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete assignment");
}

type ResultResponse =
  | GeneratedPaper
  | { ready: false; status: string };

function isPaper(data: ResultResponse): data is GeneratedPaper {
  return "sections" in data && Array.isArray(data.sections);
}

/** Returns paper when ready, or null while pending/processing/failed. */
export async function fetchResult(id: string): Promise<GeneratedPaper | null> {
  const res = await fetch(`${apiBase()}/api/assignments/${id}/result`, {
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as ResultResponse | null;
  if (!res.ok || !data) return null;
  if (!isPaper(data)) return null;
  return data;
}

export async function regenerateAssignment(id: string): Promise<void> {
  const res = await fetch(`${apiBase()}/api/assignments/${id}/regenerate`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to regenerate");
}

export function getPdfUrl(id: string): string {
  return `${apiBase()}/api/assignments/${id}/result/pdf`;
}
