import mongoose, { Document, Schema } from "mongoose";

export type AssignmentStatus = "pending" | "processing" | "done" | "failed";

export interface IQuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  grade: string;
  school: string;
  dueDate: Date;
  fileUrl?: string;
  questionTypes: IQuestionType[];
  additionalInstructions?: string;
  status: AssignmentStatus;
  resultId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const questionTypeSchema = new Schema<IQuestionType>(
  {
    type: { type: String, required: true },
    count: { type: Number, required: true, min: 1 },
    marks: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const assignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    school: { type: String, required: true },
    dueDate: { type: Date, required: true },
    fileUrl: { type: String },
    questionTypes: { type: [questionTypeSchema], required: true },
    additionalInstructions: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "processing", "done", "failed"],
      default: "pending",
    },
    resultId: { type: Schema.Types.ObjectId, ref: "GeneratedPaper" },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>(
  "Assignment",
  assignmentSchema
);
