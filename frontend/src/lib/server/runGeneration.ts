import { Assignment } from "./models/Assignment";
import { GeneratedPaper } from "./models/GeneratedPaper";
import { formatAiError, generatePaper } from "./aiService";
import { normalizePaperForSave } from "./normalizePaper";
import { connectDB } from "./db";

export async function runGeneration(assignmentId: string): Promise<void> {
  const t0 = Date.now();
  await connectDB();
  const logTimings =
    process.env.LOG_TIMINGS === "1" || process.env.NODE_ENV === "production";
  if (logTimings) {
    console.log(`[VedaAI][timing] runGeneration.start ${Date.now() - t0}ms`);
  }

  const tFind = Date.now();
  const assignment = await Assignment.findById(assignmentId);
  if (logTimings) {
    console.log(`[VedaAI][timing] Assignment.findById ${Date.now() - tFind}ms`);
  }
  if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

  assignment.status = "processing";
  assignment.failureReason = undefined;
  const tSave1 = Date.now();
  await assignment.save();
  if (logTimings) {
    console.log(`[VedaAI][timing] Assignment.save(status=processing) ${Date.now() - tSave1}ms`);
  }

  try {
    const tAi = Date.now();
    const aiResult = await generatePaper(assignment);
    if (logTimings) {
      console.log(`[VedaAI][timing] ai.generate ${Date.now() - tAi}ms`);
    }
    const normalized = normalizePaperForSave(aiResult, assignment);
    const totalQuestions = normalized.sections.reduce(
      (sum, s) => sum + s.questions.length,
      0
    );

    const tCreate = Date.now();
    const paper = await GeneratedPaper.create({
      assignmentId: assignment._id,
      sections: normalized.sections,
      metadata: {
        totalQuestions,
        totalMarks: normalized.metadata.maxMarks,
        subject: normalized.metadata.subject,
        grade: normalized.metadata.grade,
        school: normalized.metadata.school,
        timeAllowed: normalized.metadata.timeAllowed,
      },
      answerKey: normalized.answerKey,
    });
    if (logTimings) {
      console.log(`[VedaAI][timing] GeneratedPaper.create ${Date.now() - tCreate}ms`);
    }

    assignment.status = "done";
    assignment.resultId = paper._id;
    const tSave2 = Date.now();
    await assignment.save();
    if (logTimings) {
      console.log(`[VedaAI][timing] Assignment.save(status=done) ${Date.now() - tSave2}ms`);
      console.log(`[VedaAI][timing] runGeneration.total ${Date.now() - t0}ms`);
    }
  } catch (error) {
    assignment.status = "failed";
    assignment.failureReason = formatAiError(error);
    const tSaveFail = Date.now();
    await assignment.save();
    if (logTimings) {
      console.log(`[VedaAI][timing] Assignment.save(status=failed) ${Date.now() - tSaveFail}ms`);
      console.log(`[VedaAI][timing] runGeneration.total ${Date.now() - t0}ms`);
    }
    throw error;
  }
}
