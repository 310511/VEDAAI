export type AssignmentStatus = "pending" | "processing" | "done" | "failed";

export interface QuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  grade: string;
  school: string;
  dueDate: string;
  fileUrl?: string;
  questionTypes: QuestionType[];
  additionalInstructions?: string;
  status: AssignmentStatus;
  resultId?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export type Difficulty = "Easy" | "Moderate" | "Hard";

export interface PaperQuestion {
  text: string;
  difficulty: Difficulty;
  marks: number;
}

export interface PaperSection {
  title: string;
  instruction: string;
  questions: PaperQuestion[];
}

export interface AnswerKeyEntry {
  questionNumber: number;
  answer: string;
}

export interface GeneratedPaper {
  _id: string;
  assignmentId: string;
  sections: PaperSection[];
  metadata: {
    totalQuestions: number;
    totalMarks: number;
    subject: string;
    grade: string;
    school: string;
    timeAllowed: string;
  };
  answerKey: AnswerKeyEntry[];
  createdAt: string;
}

export interface CreateAssignmentPayload {
  title: string;
  subject: string;
  grade: string;
  school: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions?: string;
  file?: File | Blob | null;
}
