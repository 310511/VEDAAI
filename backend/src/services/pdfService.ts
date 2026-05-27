import puppeteer from "puppeteer";
import { IGeneratedPaper } from "../models/GeneratedPaper";
import { env } from "../config/env";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

export function buildPaperHtml(paper: IGeneratedPaper): string {
  let questionNum = 0;
  const sectionsHtml = paper.sections
    .map((section) => {
      const questionsHtml = section.questions
        .map((q) => {
          questionNum += 1;
          return `
          <div class="question">
            <div class="q-header">
              <span class="q-num">Q${questionNum}.</span>
              <span class="badge" style="color:${difficultyColor(q.difficulty)}">${q.difficulty}</span>
              <span class="marks">[${q.marks} Marks]</span>
            </div>
            <p class="q-text">${escapeHtml(q.text)}</p>
          </div>`;
        })
        .join("");

      return `
      <div class="section">
        <h2>${escapeHtml(section.title)}</h2>
        <p class="instruction"><em>${escapeHtml(section.instruction)}</em></p>
        ${questionsHtml}
      </div>`;
    })
    .join("");

  const answerKeyHtml = paper.answerKey
    .map(
      (a) =>
        `<tr><td>${a.questionNumber}</td><td>${escapeHtml(a.answer)}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, Arial, sans-serif; color: #111; padding: 40px; font-size: 12px; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 24px; }
    .school { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    .meta-row { display: flex; justify-content: space-between; margin: 16px 0; }
    .student-info { border: 1px solid #ddd; padding: 12px; margin: 16px 0; }
    .student-info span { margin-right: 40px; }
    .note { font-style: italic; text-align: center; margin: 12px 0; }
    .section { margin-top: 24px; page-break-inside: avoid; }
    .section h2 { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
    .instruction { color: #555; margin-bottom: 12px; }
    .question { margin-bottom: 16px; }
    .q-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .q-num { font-weight: 600; }
    .badge { font-size: 10px; font-weight: 600; }
    .marks { font-size: 10px; color: #666; }
    .q-text { padding-left: 20px; }
    .answer-key { margin-top: 32px; page-break-before: always; }
    .answer-key h2 { margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <div class="header">
    <div class="school">${escapeHtml(paper.metadata.school)}</div>
    <p><strong>Subject:</strong> ${escapeHtml(paper.metadata.subject)} &nbsp;|&nbsp;
       <strong>Class:</strong> ${escapeHtml(paper.metadata.grade)}</p>
    <div class="meta-row">
      <span><strong>Time Allowed:</strong> ${escapeHtml(paper.metadata.timeAllowed)}</span>
      <span><strong>Maximum Marks:</strong> ${paper.metadata.totalMarks}</span>
    </div>
    <p class="note">All questions are compulsory unless stated otherwise.</p>
  </div>
  <div class="student-info">
    <span>Name: _________________</span>
    <span>Roll Number: _________________</span>
    <span>Class &amp; Section: _________________</span>
  </div>
  ${sectionsHtml}
  <div class="answer-key">
    <h2>Answer Key</h2>
    <table>
      <thead><tr><th>Q. No.</th><th>Answer</th></tr></thead>
      <tbody>${answerKeyHtml}</tbody>
    </table>
  </div>
</body>
</html>`;
}

export async function generatePdfBuffer(
  paper: IGeneratedPaper
): Promise<Buffer> {
  const html = buildPaperHtml(paper);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
