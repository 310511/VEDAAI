"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { useAssignmentStore } from "@/lib/assignmentStore";
import { getPdfUrl } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { IconDownload, IconRefresh } from "@/components/icons";
import type { GeneratedPaper } from "@/types";

function PaperView({ paper }: { paper: GeneratedPaper }) {
  const [showKey, setShowKey] = useState(false);
  let questionNum = 0;

  return (
    <article className="print-paper mx-auto my-4 max-w-[48rem] overflow-hidden rounded-xl border border-border bg-surface shadow-card md:my-6">
      <header className="border-b border-border bg-canvas/40 px-4 py-6 text-center md:px-8 md:py-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">
          Question Paper
        </p>
        <h2 className="mt-2 font-display text-lg font-semibold tracking-tight text-ink md:text-2xl">
          {paper.metadata.school}
        </h2>
        <p className="mt-3 text-sm text-muted">
          {paper.metadata.subject}
          <span className="mx-2 hidden text-border-strong sm:inline">·</span>
          <span className="block sm:inline">Class {paper.metadata.grade}</span>
        </p>
        <div className="mt-4 flex flex-col items-center gap-2 text-sm md:mt-5 md:flex-row md:justify-center md:gap-6">
          <span>
            <span className="text-subtle">Time</span>{" "}
            <span className="font-medium text-ink">{paper.metadata.timeAllowed}</span>
          </span>
          <span>
            <span className="text-subtle">Marks</span>{" "}
            <span className="font-medium text-ink">{paper.metadata.totalMarks}</span>
          </span>
        </div>
        <p className="mt-4 text-xs italic text-muted">
          All questions are compulsory unless stated otherwise.
        </p>
      </header>

      <div className="mx-4 my-4 space-y-3 rounded-lg border border-border bg-canvas/30 px-4 py-3 text-sm text-muted md:mx-8 md:my-6 md:flex md:flex-wrap md:gap-x-8 md:space-y-0">
        <div className="border-b border-border pb-2 md:border-0 md:pb-0">
          Name: _________________________
        </div>
        <div className="border-b border-border pb-2 md:border-0 md:pb-0">
          Roll No.: _________________________
        </div>
        <div>Class / Section: _________________________</div>
      </div>

      <div className="px-4 pb-6 md:px-8 md:pb-8">
        {paper.sections.map((section, sIdx) => (
          <section key={section.title} className={sIdx > 0 ? "mt-8 md:mt-10" : ""}>
            <h3 className="text-base font-semibold text-ink md:font-display md:text-lg">
              {section.title}
            </h3>
            <p className="mt-1 text-sm italic text-muted">{section.instruction}</p>
            <ol className="mt-4 space-y-4 md:mt-5 md:space-y-6">
              {section.questions.map((q) => {
                questionNum += 1;
                const num = questionNum;
                return (
                  <li
                    key={num}
                    className="rounded-lg border border-border/60 p-3 md:border-0 md:border-l-2 md:border-accent/20 md:p-0 md:pl-4"
                  >
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-semibold tabular-nums text-ink">{num}.</span>
                      <DifficultyBadge difficulty={q.difficulty} />
                      <span className="text-xs text-subtle">{q.marks} marks</span>
                    </div>
                    <p className="text-sm leading-relaxed text-ink md:text-base">{q.text}</p>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}

        <div className="mt-8 border-t border-border pt-5 md:mt-10 md:pt-6">
          <button
            type="button"
            className="flex min-h-[44px] w-full items-center justify-between text-sm font-medium text-accent md:inline-flex md:w-auto md:justify-start"
            onClick={() => setShowKey(!showKey)}
            aria-expanded={showKey}
          >
            <span>{showKey ? "Hide answer key" : "Show answer key"}</span>
            <span className="text-lg">{showKey ? "▲" : "▼"}</span>
          </button>
          {showKey && (
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-canvas text-left text-xs font-medium uppercase tracking-wide text-subtle">
                    <th className="border-b border-border px-3 py-2.5 w-14 md:px-4 md:w-20">
                      Q.
                    </th>
                    <th className="border-b border-border px-3 py-2.5 md:px-4">Answer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paper.answerKey.map((a) => (
                    <tr key={a.questionNumber}>
                      <td className="px-3 py-2.5 text-sm font-medium tabular-nums md:px-4">
                        {a.questionNumber}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-muted md:px-4">{a.answer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ResultPage() {
  const params = useParams();
  const id = params.id as string;
  const {
    currentAssignment,
    currentResult,
    fetchAssignment,
    fetchResult,
    subscribeToAssignment,
    regenerate,
    error,
    setResult,
  } = useAssignmentStore();

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const syncFromAssignment = useCallback(
    async (assignment: NonNullable<typeof currentAssignment>) => {
      if (assignment.status === "done") {
        const paper = await fetchResult(id);
        if (paper) {
          setLoading(false);
          setFailed(false);
        }
        return;
      }
      if (assignment.status === "failed") {
        setLoading(false);
        setFailed(true);
        return;
      }
      setLoading(true);
      setFailed(false);
    },
    [id, fetchResult]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchAssignment(id);
      if (cancelled) return;
      const assignment = useAssignmentStore.getState().currentAssignment;
      if (assignment) await syncFromAssignment(assignment);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, fetchAssignment, syncFromAssignment]);

  useEffect(() => {
    const unsub = subscribeToAssignment(
      id,
      () => {
        setLoading(false);
        setFailed(false);
      },
      (message) => {
        setLoading(false);
        setFailed(true);
        useAssignmentStore.setState({ error: message });
      }
    );
    return unsub;
  }, [id, subscribeToAssignment]);

  useEffect(() => {
    if (currentAssignment?.status === "done" && currentResult) {
      setLoading(false);
      setFailed(false);
    }
    if (currentAssignment?.status === "failed") {
      setLoading(false);
      setFailed(true);
    }
  }, [currentAssignment, currentResult]);

  const handleRegenerate = async () => {
    setLoading(true);
    setFailed(false);
    setResult(null);
    await regenerate(id);
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setPdfError(null);
    try {
      const res = await fetch(getPdfUrl(id));
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          typeof body.error === "string" ? body.error : "PDF generation failed"
        );
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "question-paper.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const desktopToolbar = currentResult ? (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleDownloadPdf}
        disabled={downloadingPdf}
      >
        <IconDownload />
        {downloadingPdf ? "Preparing…" : "PDF"}
      </Button>
      <Button variant="primary" size="sm" onClick={handleRegenerate}>
        <IconRefresh />
        Regenerate
      </Button>
    </>
  ) : null;

  return (
    <AppShell hideMobileTopBar>
      <div className="no-print">
        <Header
          title="Question paper"
          showBack
          subtitle={currentAssignment?.title}
          actions={desktopToolbar}
        />
      </div>

      <main className="overflow-x-hidden px-4 pb-36 md:px-8 md:pb-8">
        {pdfError && (
          <p className="mx-auto mt-4 max-w-[48rem] rounded-lg border border-danger/20 bg-danger-soft px-4 py-2.5 text-sm text-danger">
            {pdfError}
          </p>
        )}

        {loading && !currentResult && !failed && (
          <div className="flex flex-col items-center justify-center px-4 py-24 md:py-32">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
            </div>
            <p className="mt-8 text-center font-display text-xl font-semibold text-ink">
              Writing your paper
            </p>
            <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-muted">
              Structuring sections, balancing difficulty, and aligning marks. This
              usually takes under a minute.
            </p>
          </div>
        )}

        {failed && (
          <div className="mx-auto mt-12 max-w-md card p-6 text-center md:mt-16 md:p-8">
            <p className="font-display text-lg font-semibold text-danger">
              Couldn&apos;t generate
            </p>
            <p className="mt-2 text-sm text-muted">{error || "Something went wrong. Try again."}</p>
            <Button className="mt-6 min-h-[44px] w-full md:w-auto" onClick={handleRegenerate}>
              <IconRefresh />
              Try again
            </Button>
          </div>
        )}

        {currentResult && <PaperView paper={currentResult} />}
      </main>

      {currentResult && (
        <div className="no-print fixed bottom-16 left-0 right-0 z-40 flex gap-3 border-t border-gray-200 bg-white p-3 md:hidden">
          <Button
            variant="secondary"
            className="min-h-[44px] flex-1"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
          >
            <IconDownload />
            {downloadingPdf ? "Preparing…" : "Download PDF"}
          </Button>
          <Button variant="primary" className="min-h-[44px] flex-1" onClick={handleRegenerate}>
            <IconRefresh />
            Regenerate
          </Button>
        </div>
      )}
    </AppShell>
  );
}
