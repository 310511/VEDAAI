import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server/db";
import { Assignment } from "@/lib/server/models/Assignment";
import { triggerGeneration } from "@/lib/server/triggerGeneration";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  try {
    await connectDB();
    const assignments = await Assignment.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(assignments);
  } catch {
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const formData = await req.formData();

    const title = String(formData.get("title") || "");
    const subject = String(formData.get("subject") || "");
    const grade = String(formData.get("grade") || "");
    const school = String(formData.get("school") || "");
    const dueDate = String(formData.get("dueDate") || "");
    const questionTypesRaw = formData.get("questionTypes");
    const additionalInstructions = String(formData.get("additionalInstructions") || "");

    if (!title || !subject || !grade || !school || !dueDate || !questionTypesRaw) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const questionTypes =
      typeof questionTypesRaw === "string"
        ? JSON.parse(questionTypesRaw)
        : questionTypesRaw;

    const file = formData.get("file");
    const fileUrl =
      file instanceof File && file.size > 0 ? `upload:${file.name}` : undefined;

    const assignment = await Assignment.create({
      title,
      subject,
      grade,
      school,
      dueDate: new Date(dueDate),
      fileUrl,
      questionTypes,
      additionalInstructions,
      status: "processing",
    });

    await triggerGeneration(assignment._id.toString());

    return NextResponse.json(
      { assignmentId: assignment._id, assignment },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create assignment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
