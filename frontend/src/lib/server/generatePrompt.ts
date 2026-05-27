import type { IAssignment } from "./models/Assignment";

const SECTION_LABELS: Record<string, string> = {
  MCQ: "Section A",
  "Multiple Choice": "Section A",
  Short: "Section B",
  "Short Answer": "Section B",
  Diagram: "Section C",
  Numerical: "Section D",
  Essay: "Section E",
  Long: "Section F",
};

function getSectionTitle(type: string, index: number): string {
  return SECTION_LABELS[type] || `Section ${String.fromCharCode(65 + index)}`;
}

export function generatePrompt(assignment: IAssignment): string {
  const questionBreakdown = assignment.questionTypes
    .map(
      (qt) =>
        `- ${qt.type}: exactly ${qt.count} questions, each worth ${qt.marks} mark(s)`
    )
    .join("\n");

  const totalQuestions = assignment.questionTypes.reduce(
    (sum, qt) => sum + qt.count,
    0
  );
  const totalMarks = assignment.questionTypes.reduce(
    (sum, qt) => sum + qt.count * qt.marks,
    0
  );

  const sectionMapping = assignment.questionTypes
    .map((qt, i) => {
      const title = getSectionTitle(qt.type, i);
      return `"${qt.type}" questions → "${title}" with instruction mentioning ${qt.marks} mark(s) per question`;
    })
    .join("\n");

  return `You are an expert educational assessment designer. Generate a complete question paper as a single JSON object.

ASSIGNMENT DETAILS:
- Title: ${assignment.title}
- Subject: ${assignment.subject}
- Grade/Class: ${assignment.grade}
- School: ${assignment.school}
- Total questions required: ${totalQuestions}
- Total marks: ${totalMarks}
${assignment.additionalInstructions ? `- Additional instructions: ${assignment.additionalInstructions}` : ""}

QUESTION TYPE REQUIREMENTS (honor exact counts and marks):
${questionBreakdown}

SECTION MAPPING:
${sectionMapping}

DIFFICULTY DISTRIBUTION (across ALL questions):
- Approximately 40% Easy
- Approximately 40% Moderate
- Approximately 20% Hard

RULES:
1. Group questions by type into separate sections as mapped above.
2. Each section must have a clear title (e.g., "Section A") and instruction text stating marks per question.
3. Question text must be curriculum-appropriate for grade ${assignment.grade} in ${assignment.subject}.
4. Include a complete answerKey with sequential questionNumber starting from 1 across all sections.
5. metadata.maxMarks must equal ${totalMarks}.
6. metadata.timeAllowed should be a reasonable duration string (e.g., "3 hours").
7. Keep each question "text" under 80 words (concise exam-style wording).
8. In JSON strings, escape double quotes as \\". No raw newlines inside string values.

OUTPUT FORMAT — return ONLY valid JSON. Use this EXACT schema (field names matter):

{
  "metadata": {
    "subject": "string",
    "grade": "string",
    "school": "string",
    "timeAllowed": "string",
    "maxMarks": number
  },
  "sections": [
    {
      "title": "Section A",
      "instruction": "string",
      "questions": [
        { "text": "string", "difficulty": "Easy", "marks": number }
      ]
    }
  ],
  "answerKey": [
    { "questionNumber": 1, "answer": "string" }
  ]
}

Use "grade" (not "class"). Every answerKey item MUST have both "questionNumber" and "answer".
Valid difficulty: "Easy", "Moderate", "Hard".
Output ONLY the JSON object.`;
}
