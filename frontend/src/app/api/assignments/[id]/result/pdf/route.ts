import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/server/db";
import { Assignment } from "@/lib/server/models/Assignment";
import { GeneratedPaper } from "@/lib/server/models/GeneratedPaper";
import { generatePdfBuffer } from "@/lib/server/pdfService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const assignment = await Assignment.findById(params.id);
    if (!assignment?.resultId) {
      return NextResponse.json({ error: "Result not available" }, { status: 404 });
    }
    const paper = await GeneratedPaper.findById(assignment.resultId);
    if (!paper) {
      return NextResponse.json({ error: "Generated paper not found" }, { status: 404 });
    }

    const pdfBuffer = await generatePdfBuffer(paper);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="question-paper.pdf"',
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
