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
    const assignment = await Assignment.findById(params.id).lean();
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    return NextResponse.json(assignment);
  } catch {
    return NextResponse.json({ error: "Failed to fetch assignment" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const assignment = await Assignment.findByIdAndDelete(params.id);
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    await GeneratedPaper.deleteMany({ assignmentId: params.id });
    return NextResponse.json({ message: "Assignment deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
