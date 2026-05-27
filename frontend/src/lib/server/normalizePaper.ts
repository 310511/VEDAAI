import type { IAssignment } from "./models/Assignment";
import type { GeneratedPaperResponse } from "./parsePaperJson";

type Difficulty = "Easy" | "Moderate" | "Hard";

function asString(value: unknown, fallback: string): string {
  if (value === null || value === undefined) return fallback;
  const s = String(value).trim();
  return s || fallback;
}

function asNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeDifficulty(value: unknown): Difficulty {
  const s = String(value ?? "Moderate").trim();
  if (/easy/i.test(s)) return "Easy";
  if (/hard/i.test(s)) return "Hard";
  return "Moderate";
}

function getAnswerFromEntry(entry: Record<string, unknown> | undefined): string {
  if (!entry) return "—";
  const candidates = [
    entry.answer,
    entry.correctAnswer,
    entry.correct_answer,
    entry.solution,
    entry.value,
    entry.text,
    entry.key,
  ];
  for (const c of candidates) {
    const s = asString(c, "");
    if (s) return s;
  }
  return "—";
}

export function normalizePaperForSave(
  raw: GeneratedPaperResponse | Record<string, unknown>,
  assignment: IAssignment
): GeneratedPaperResponse {
  const data = raw as Record<string, unknown>;
  const meta = (data.metadata ?? {}) as Record<string, unknown>;
  const sectionsRaw = (data.sections ?? []) as Record<string, unknown>[];

  const sections = sectionsRaw.map((section, si) => {
    const questionsRaw = (section.questions ?? []) as Record<string, unknown>[];
    return {
      title: asString(section.title, `Section ${String.fromCharCode(65 + si)}`),
      instruction: asString(
        section.instruction,
        "Attempt all questions."
      ),
      questions: questionsRaw.map((q) => ({
        text: asString(q.text ?? q.question ?? q.content, "Question text missing"),
        difficulty: normalizeDifficulty(q.difficulty),
        marks: asNumber(q.marks ?? q.mark, 1),
      })),
    };
  });

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const totalMarksFromSections = sections.reduce(
    (sum, s) => sum + s.questions.reduce((t, q) => t + q.marks, 0),
    0
  );

  const assignmentMarks = assignment.questionTypes.reduce(
    (sum, qt) => sum + qt.count * qt.marks,
    0
  );

  const answerKeyRaw =
    (data.answerKey as Record<string, unknown>[] | undefined) ??
    (data.answer_key as Record<string, unknown>[] | undefined) ??
    (data.answers as Record<string, unknown>[] | undefined) ??
    [];

  const answerKey = Array.from({ length: totalQuestions }, (_, i) => {
    const num = i + 1;
    const entry = answerKeyRaw.find((a) => {
      const n = Number(a.questionNumber ?? a.questionNo ?? a.qNo ?? a.number ?? a.q);
      return n === num;
    });
    return {
      questionNumber: num,
      answer: getAnswerFromEntry(entry),
    };
  });

  return {
    metadata: {
      subject: asString(meta.subject, assignment.subject),
      grade: asString(
        meta.grade ?? meta.class ?? meta.className ?? meta.standard,
        assignment.grade
      ),
      school: asString(meta.school, assignment.school),
      timeAllowed: asString(meta.timeAllowed ?? meta.time_allowed ?? meta.duration, "3 hours"),
      maxMarks: asNumber(
        meta.maxMarks ?? meta.max_marks ?? meta.totalMarks ?? meta.total_marks,
        totalMarksFromSections || assignmentMarks
      ),
    },
    sections,
    answerKey,
  };
}
