import { IAssignment } from "../models/Assignment";

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

OUTPUT FORMAT — return ONLY valid JSON with NO markdown, NO code fences, NO preamble or explanation. Use this exact structure:

{
  "metadata": {
    "subject": "${assignment.subject}",
    "grade": "${assignment.grade}",
    "school": "${assignment.school}",
    "timeAllowed": "string",
    "maxMarks": ${totalMarks}
  },
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries X marks.",
      "questions": [
        {
          "text": "question text here",
          "difficulty": "Easy",
          "marks": number
        }
      ]
    }
  ],
  "answerKey": [
    { "questionNumber": 1, "answer": "answer text" }
  ]
}

Valid difficulty values: "Easy", "Moderate", "Hard".
Output ONLY the JSON object.`;
}
