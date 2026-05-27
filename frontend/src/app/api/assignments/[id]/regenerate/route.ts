import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server/db";
import { Assignment } from "@/lib/server/models/Assignment";
import { GeneratedPaper } from "@/lib/server/models/GeneratedPaper";
import { triggerGeneration } from "@/lib/server/triggerGeneration";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const assignment = await Assignment.findById(params.id);
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const oldResultId = assignment.resultId;
    assignment.status = "processing";
    assignment.resultId = undefined;
    assignment.failureReason = undefined;
    await assignment.save();

    if (oldResultId) {
      await GeneratedPaper.findByIdAndDelete(oldResultId);
    }

    await triggerGeneration(assignment._id.toString());

    return NextResponse.json({
      message: "Regeneration queued",
      assignmentId: assignment._id,
    });
  } catch {
    return NextResponse.json({ error: "Failed to regenerate" }, { status: 500 });
  }
}
