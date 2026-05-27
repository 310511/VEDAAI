import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server/db";
import { Assignment } from "@/lib/server/models/Assignment";

export const runtime = "nodejs";

/** Mark assignments stuck in processing/pending > 3 min as failed. */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();
  const assignment = await Assignment.findById(params.id);
  if (!assignment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (assignment.status === "processing" || assignment.status === "pending") {
    assignment.status = "failed";
    assignment.failureReason =
      "Generation timed out or was interrupted. Click Regenerate to try again.";
    await assignment.save();
  }

  return NextResponse.json(assignment);
}
