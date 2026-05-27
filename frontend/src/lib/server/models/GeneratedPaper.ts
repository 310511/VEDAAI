import mongoose, { Document, Schema } from "mongoose";

export type Difficulty = "Easy" | "Moderate" | "Hard";

export interface IQuestion {
  text: string;
  difficulty: Difficulty;
  marks: number;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAnswerKeyEntry {
  questionNumber: number;
  answer: string;
}

export interface IPaperMetadata {
  totalQuestions: number;
  totalMarks: number;
  subject: string;
  grade: string;
  school: string;
  timeAllowed: string;
}

export interface IGeneratedPaper extends Document {
  assignmentId: mongoose.Types.ObjectId;
  sections: ISection[];
  metadata: IPaperMetadata;
  answerKey: IAnswerKeyEntry[];
  createdAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    text: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Moderate", "Hard"],
      required: true,
    },
    marks: { type: Number, required: true },
  },
  { _id: false }
);

const sectionSchema = new Schema<ISection>(
  {
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: { type: [questionSchema], required: true },
  },
  { _id: false }
);

const answerKeySchema = new Schema<IAnswerKeyEntry>(
  {
    questionNumber: { type: Number, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const metadataSchema = new Schema<IPaperMetadata>(
  {
    totalQuestions: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    school: { type: String, required: true },
    timeAllowed: { type: String, required: true },
  },
  { _id: false }
);

const generatedPaperSchema = new Schema<IGeneratedPaper>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    sections: { type: [sectionSchema], required: true },
    metadata: { type: metadataSchema, required: true },
    answerKey: { type: [answerKeySchema], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const GeneratedPaper =
  mongoose.models.GeneratedPaper ||
  mongoose.model<IGeneratedPaper>("GeneratedPaper", generatedPaperSchema);
