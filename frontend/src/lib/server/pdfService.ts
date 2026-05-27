import PDFDocument from "pdfkit";
import type { IGeneratedPaper } from "./models/GeneratedPaper";

const PAGE_WIDTH = 595.28;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function difficultyColor(d: string): string {
  switch (d) {
    case "Easy":
      return "#16a34a";
    case "Moderate":
      return "#d97706";
    case "Hard":
      return "#dc2626";
    default:
      return "#6b7280";
  }
}

function ensureSpace(doc: InstanceType<typeof PDFDocument>, height: number): void {
  const bottom = doc.page.height - MARGIN;
  if (doc.y + height > bottom) {
    doc.addPage();
  }
}

export function generatePdfBuffer(paper: IGeneratedPaper): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { metadata } = paper;

    doc.font("Helvetica-Bold").fontSize(20).text(metadata.school, {
      align: "center",
      width: CONTENT_WIDTH,
    });
    doc.moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(11)
      .text(
        `Subject: ${metadata.subject}  |  Class: ${metadata.grade}`,
        { align: "center", width: CONTENT_WIDTH }
      );
    doc.moveDown(0.4);

    doc.text(
      `Time Allowed: ${metadata.timeAllowed}          Maximum Marks: ${metadata.totalMarks}`,
      { align: "center", width: CONTENT_WIDTH }
    );
    doc.moveDown(0.3);

    doc
      .font("Helvetica-Oblique")
      .fontSize(10)
      .fillColor("#555555")
      .text("All questions are compulsory unless stated otherwise.", {
        align: "center",
        width: CONTENT_WIDTH,
      });
    doc.fillColor("#000000");

    doc.moveDown(0.8);
    const boxY = doc.y;
    doc.rect(MARGIN, boxY, CONTENT_WIDTH, 36).stroke("#cccccc");
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(
        "Name: ___________________    Roll Number: ___________________    Class & Section: ___________________",
        MARGIN + 10,
        boxY + 12,
        { width: CONTENT_WIDTH - 20 }
      );
    doc.y = boxY + 48;

    let questionNum = 0;

    for (const section of paper.sections) {
      ensureSpace(doc, 60);
      doc.moveDown(0.5);
      doc.font("Helvetica-Bold").fontSize(13).fillColor("#000000").text(section.title);
      doc.moveDown(0.2);
      doc
        .font("Helvetica-Oblique")
        .fontSize(10)
        .fillColor("#555555")
        .text(section.instruction, { width: CONTENT_WIDTH });
      doc.fillColor("#000000");
      doc.moveDown(0.5);

      for (const q of section.questions) {
        questionNum += 1;
        const header = `Q${questionNum}.  [${q.marks} Marks]`;
        const headerHeight = doc.heightOfString(header, { width: CONTENT_WIDTH });
        const textHeight = doc.heightOfString(q.text, {
          width: CONTENT_WIDTH - 16,
          lineGap: 2,
        });
        ensureSpace(doc, headerHeight + textHeight + 24);

        doc.font("Helvetica-Bold").fontSize(11).text(header, { continued: true });
        doc
          .fillColor(difficultyColor(q.difficulty))
          .font("Helvetica-Bold")
          .fontSize(9)
          .text(`  ${q.difficulty}`, { continued: false });
        doc.fillColor("#000000").moveDown(0.15);

        doc
          .font("Helvetica")
          .fontSize(11)
          .text(q.text, MARGIN + 16, doc.y, {
            width: CONTENT_WIDTH - 16,
            lineGap: 2,
          });
        doc.moveDown(0.6);
      }
    }

    doc.addPage();
    doc.font("Helvetica-Bold").fontSize(14).text("Answer Key", { underline: true });
    doc.moveDown(0.6);

    const colQ = MARGIN;
    const colA = MARGIN + 80;
    const rowHeight = 22;
    let tableY = doc.y;

    doc.font("Helvetica-Bold").fontSize(10);
    doc.rect(colQ, tableY, CONTENT_WIDTH, rowHeight).fill("#f3f4f6");
    doc.fillColor("#000000");
    doc.text("Q. No.", colQ + 8, tableY + 6, { width: 60 });
    doc.text("Answer", colA + 8, tableY + 6, { width: CONTENT_WIDTH - 90 });
    tableY += rowHeight;

    doc.font("Helvetica").fontSize(10);
    for (const entry of paper.answerKey) {
      if (tableY + rowHeight > doc.page.height - MARGIN) {
        doc.addPage();
        tableY = MARGIN;
      }
      doc.rect(colQ, tableY, CONTENT_WIDTH, rowHeight).stroke("#dddddd");
      doc.text(String(entry.questionNumber), colQ + 8, tableY + 6, { width: 60 });
      doc.text(entry.answer, colA + 8, tableY + 6, {
        width: CONTENT_WIDTH - 90,
      });
      tableY += rowHeight;
    }

    doc.end();
  });
}
