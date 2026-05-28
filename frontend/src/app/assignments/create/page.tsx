"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { useAssignmentStore } from "@/lib/assignmentStore";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { IconChevronLeft, IconUpload } from "@/components/icons";
import type { QuestionType } from "@/types";

const QUESTION_TYPE_OPTIONS = ["MCQ", "Short", "Diagram", "Numerical", "Essay", "Long"];

const TYPE_LABELS: Record<string, string> = {
  MCQ: "Multiple Choice Questions",
  Short: "Short Answer Questions",
  Diagram: "Diagram-Based Questions",
  Numerical: "Numerical Problems",
  Essay: "Essay Questions",
  Long: "Long Answer Questions",
};

const DEFAULT_ROWS: QuestionType[] = [
  { type: "MCQ", count: 4, marks: 1 },
  { type: "Short", count: 3, marks: 2 },
  { type: "Diagram", count: 5, marks: 3 },
  { type: "Numerical", count: 5, marks: 5 },
];

function parseDueDate(ddmmyyyy: string): string {
  const [dd, mm, yyyy] = ddmmyyyy.split("-").map(Number);
  if (!dd || !mm || !yyyy) throw new Error("Invalid date");
  return new Date(yyyy, mm - 1, dd).toISOString();
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { createAssignment } = useAssignmentStore();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(DEFAULT_ROWS);
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [mainFile, setMainFile] = useState<File | undefined>(undefined);
  const [supplementaryFile, setSupplementaryFile] = useState<File | undefined>(undefined);

  const totals = useMemo(
    () => ({
      questions: questionTypes.reduce((s, r) => s + (r.count || 0), 0),
      marks: questionTypes.reduce((s, r) => s + (r.count || 0) * (r.marks || 0), 0),
    }),
    [questionTypes]
  );

  const progress = step === 1 ? 50 : 100;

  const validateStep1 = (): string | null => {
    if (!title.trim() || !subject.trim() || !grade.trim() || !school.trim() || !dueDate.trim()) {
      return "Please fill all required fields.";
    }
    if (!/^\d{2}-\d{2}-\d{4}$/.test(dueDate)) {
      return "Due date must be DD-MM-YYYY.";
    }
    if (questionTypes.length === 0) return "Add at least one question type.";
    for (const row of questionTypes) {
      if (!row.type || row.count < 1 || row.marks < 1) {
        return "Each row needs a type, positive count, and positive marks.";
      }
    }
    return null;
  };

  const updateRow = (index: number, field: keyof QuestionType, value: string | number) => {
    setQuestionTypes((rows) =>
      rows.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async () => {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const assignmentId = await createAssignment({
        title,
        subject,
        grade,
        school,
        dueDate: parseDueDate(dueDate),
        questionTypes,
        additionalInstructions,
        file: supplementaryFile || mainFile,
      });
      router.push(`/assignments/${assignmentId}/result`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
      setSubmitting(false);
    }
  };

  const questionTypesSection = (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-ink md:section-title">Question breakdown</h3>
        <button
          type="button"
          className="shrink-0 text-sm font-medium text-accent hover:underline"
          onClick={() => setQuestionTypes((r) => [...r, { type: "MCQ", count: 1, marks: 1 }])}
        >
          + Add row
        </button>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 md:hidden">
        {questionTypes.map((row, i) => (
          <div key={i} className="rounded-xl border border-border bg-canvas/30 p-4">
            <p className="text-sm font-semibold text-ink">
              {TYPE_LABELS[row.type] || row.type}
            </p>
            <label className="mt-2 block">
              <span className="text-xs font-medium text-subtle">Change type</span>
              <select
                className="input-field mt-1"
                value={row.type}
                onChange={(e) => updateRow(i, "type", e.target.value)}
              >
                {QUESTION_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t] || t}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-3 space-y-3">
              <Stepper
                label="Questions"
                value={row.count}
                onChange={(v) => updateRow(i, "count", v)}
              />
              <Stepper
                label="Marks"
                value={row.marks}
                onChange={(v) => updateRow(i, "marks", v)}
              />
            </div>
            {questionTypes.length > 1 && (
              <button
                type="button"
                className="mt-3 min-h-[44px] text-sm font-medium text-danger"
                onClick={() => setQuestionTypes((r) => r.filter((_, j) => j !== i))}
              >
                Delete
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="flex min-h-[44px] w-full items-center justify-center rounded-lg border border-dashed border-border bg-white text-sm font-medium text-accent"
          onClick={() => setQuestionTypes((r) => [...r, { type: "MCQ", count: 1, marks: 1 }])}
        >
          + Add Question Type
        </button>
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-left text-xs font-medium uppercase tracking-wide text-subtle">
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5 w-20">Count</th>
              <th className="px-3 py-2.5 w-20">Marks</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {questionTypes.map((row, i) => (
              <tr key={i}>
                <td className="px-3 py-2">
                  <select
                    className="input-field py-1.5"
                    value={row.type}
                    onChange={(e) => updateRow(i, "type", e.target.value)}
                  >
                    {QUESTION_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    className="input-field py-1.5"
                    value={row.count}
                    onChange={(e) =>
                      updateRow(i, "count", parseInt(e.target.value, 10) || 0)
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    className="input-field py-1.5"
                    value={row.marks}
                    onChange={(e) =>
                      updateRow(i, "marks", parseInt(e.target.value, 10) || 0)
                    }
                  />
                </td>
                <td className="px-2 py-2 text-center">
                  {questionTypes.length > 1 && (
                    <button
                      type="button"
                      className="text-subtle hover:text-danger"
                      onClick={() => setQuestionTypes((r) => r.filter((_, j) => j !== i))}
                      aria-label="Remove row"
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 md:block">
        <span className="rounded-full bg-accent-soft/60 px-3 py-1.5 text-sm text-accent md:hidden">
          <span className="font-medium">{totals.questions}</span> Total Questions
        </span>
        <span className="rounded-full bg-accent-soft/60 px-3 py-1.5 text-sm text-accent md:hidden">
          <span className="font-medium">{totals.marks}</span> Total Marks
        </span>
        <p className="hidden rounded-lg bg-accent-soft/60 px-3 py-2 text-sm text-accent md:block">
          <span className="font-medium">{totals.questions}</span> questions ·{" "}
          <span className="font-medium">{totals.marks}</span> total marks
        </p>
      </div>
    </div>
  );

  return (
    <AppShell hideMobileTopBar>
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center border-b border-gray-200 bg-white px-2 md:hidden">
        <Link
          href="/assignments"
          className="flex h-11 w-11 items-center justify-center text-gray-700"
          aria-label="Back"
        >
          <IconChevronLeft />
        </Link>
        <h1 className="flex-1 text-center text-base font-semibold text-gray-900">
          Create Assignment
        </h1>
        <div className="w-11" aria-hidden />
      </header>

      <div className="hidden md:block">
        <Header title="New assignment" showBack subtitle="Set up your question paper" />
      </div>

      <div className="fixed top-14 left-0 right-0 z-30 h-1 bg-gray-200 md:top-auto md:relative md:z-0 md:bg-transparent">
        <div
          className="h-full bg-[#1B4332] transition-all duration-300 md:hidden"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="mx-auto max-w-2xl overflow-x-hidden px-4 pb-36 pt-[4.25rem] md:max-w-2xl md:pb-32 md:pt-0 md:px-8 md:py-8">
        <div className="mb-6 hidden md:mb-8 md:block">
          <div className="flex items-center justify-between">
            {["Details", "Materials"].map((label, i) => {
              const num = i + 1;
              const active = step === num;
              const done = step > num;
              return (
                <div key={label} className="flex flex-1 items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        active
                          ? "bg-accent text-white"
                          : done
                            ? "bg-accent-soft text-accent"
                            : "bg-canvas text-subtle border border-border"
                      }`}
                    >
                      {done ? "✓" : num}
                    </span>
                    <span
                      className={`text-sm ${active ? "font-medium text-ink" : "text-muted"}`}
                    >
                      {label}
                    </span>
                  </div>
                  {i === 0 && (
                    <div
                      className={`mx-3 h-px flex-1 ${done ? "bg-accent/40" : "bg-border"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="card space-y-5 p-4 md:space-y-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2 md:gap-5">
              <label className="block md:col-span-2">
                <span className="label-text">Title</span>
                <input
                  className="input-field mt-1.5"
                  placeholder="e.g. Unit Test — Light & Optics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label-text">Subject</span>
                <input
                  className="input-field mt-1.5"
                  placeholder="Physics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label-text">Class</span>
                <input
                  className="input-field mt-1.5"
                  placeholder="10"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="label-text">School</span>
                <input
                  className="input-field mt-1.5"
                  placeholder="Delhi Public School"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="label-text">Due date</span>
                <input
                  placeholder="26-05-2026"
                  className="input-field mt-1.5 w-full"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <span className="mt-1 block text-xs text-subtle">Format: DD-MM-YYYY</span>
              </label>
            </div>

            <div
              className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-canvas/50 p-6 text-center md:min-h-0 md:p-8"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  setMainFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <IconUpload className="text-subtle" />
              <p className="mt-3 text-sm text-muted">
                Reference material <span className="text-subtle">(optional)</span>
              </p>
              <label className="mt-4 inline-flex min-h-[44px] cursor-pointer items-center">
                <span className="text-sm font-medium text-accent hover:underline">
                  Choose file
                </span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="sr-only"
                  onChange={(e) => setMainFile(e.target.files?.[0] || undefined)}
                />
              </label>
              {mainFile && (
                <p className="mt-3 break-all text-sm font-medium text-accent">
                  {mainFile.name || "File selected"}
                </p>
              )}
            </div>

            {questionTypesSection}

            <label className="block">
              <span className="label-text">Additional instructions</span>
              <textarea
                className="input-field mt-1.5 min-h-[96px] w-full resize-y"
                placeholder="Difficulty mix, topics to emphasize, formatting notes…"
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
              />
            </label>

            <div className="flex flex-col gap-3 border-t border-border pt-6 md:flex-row md:justify-end">
              <Button
                type="button"
                className="w-full min-h-[44px] md:w-auto"
                onClick={() => {
                  const v = validateStep1();
                  if (v) setError(v);
                  else {
                    setError("");
                    setStep(2);
                  }
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card space-y-5 p-4 md:space-y-6 md:p-8">
            <div>
              <h3 className="text-base font-semibold text-ink md:section-title">
                Supplementary material
              </h3>
              <p className="mt-1 text-sm text-muted">
                Optional extra context for the generator.
              </p>
            </div>

            <div
              className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-canvas/50 p-8 text-center md:min-h-0 md:p-12"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  setSupplementaryFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <IconUpload className="text-subtle" />
              <label className="mt-4 inline-flex min-h-[44px] cursor-pointer items-center">
                <span className="text-sm font-medium text-accent hover:underline">
                  Upload file
                </span>
                <input
                  type="file"
                  className="sr-only"
                  onChange={(e) => setSupplementaryFile(e.target.files?.[0] || undefined)}
                />
              </label>
              {supplementaryFile && (
                <p className="mt-3 break-all text-sm font-medium text-accent">
                  {supplementaryFile.name || "File selected"}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 md:flex-row md:justify-between">
              <Button
                type="button"
                variant="secondary"
                className="w-full min-h-[44px] md:w-auto"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="button"
                disabled={submitting}
                className="w-full min-h-[44px] md:w-auto"
                onClick={handleSubmit}
              >
                {submitting ? "Creating…" : "Generate paper"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
