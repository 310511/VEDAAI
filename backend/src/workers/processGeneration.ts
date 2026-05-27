import { Job } from "bullmq";
import { Assignment } from "../models/Assignment";
import { GeneratedPaper } from "../models/GeneratedPaper";
import { generatePaperWithGemini } from "../services/geminiService";
import { emitToAssignment } from "../socket/io";

export interface GenerationJobData {
  assignmentId: string;
}

export async function processGenerationJob(
  job: Job<GenerationJobData>
): Promise<void> {
  const { assignmentId } = job.data;

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new Error(`Assignment ${assignmentId} not found`);
  }

  assignment.status = "processing";
  await assignment.save();
  emitToAssignment(assignmentId, "assignment:processing", { assignmentId });

  try {
    const aiResult = await generatePaperWithGemini(assignment);

    const totalQuestions = aiResult.sections.reduce(
      (sum, s) => sum + s.questions.length,
      0
    );

    const paper = await GeneratedPaper.create({
      assignmentId: assignment._id,
      sections: aiResult.sections,
      metadata: {
        totalQuestions,
        totalMarks: aiResult.metadata.maxMarks,
        subject: aiResult.metadata.subject,
        grade: aiResult.metadata.grade,
        school: aiResult.metadata.school,
        timeAllowed: aiResult.metadata.timeAllowed,
      },
      answerKey: aiResult.answerKey,
    });

    assignment.status = "done";
    assignment.resultId = paper._id;
    await assignment.save();

    emitToAssignment(assignmentId, "assignment:done", {
      assignmentId,
      resultId: paper._id.toString(),
    });
  } catch (error) {
    assignment.status = "failed";
    await assignment.save();

    const message =
      error instanceof Error ? error.message : "Generation failed";
    emitToAssignment(assignmentId, "assignment:failed", {
      assignmentId,
      error: message,
    });
    throw error;
  }
}
