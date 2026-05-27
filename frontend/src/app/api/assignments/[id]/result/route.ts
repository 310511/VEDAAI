import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server/db";
import { Assignment } from "@/lib/server/models/Assignment";
import { GeneratedPaper } from "@/lib/server/models/GeneratedPaper";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const assignment = await Assignment.findById(params.id);
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    if (!assignment.resultId) {
      return NextResponse.json({
        ready: false,
        status: assignment.status,
      });
    }
    const paper = await GeneratedPaper.findById(assignment.resultId).lean();
    if (!paper) {
      return NextResponse.json({ error: "Generated paper not found" }, { status: 404 });
    }
    return NextResponse.json(paper);
  } catch {
    return NextResponse.json({ error: "Failed to fetch result" }, { status: 500 });
  }
}
