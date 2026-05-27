"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AssignmentCard } from "@/components/AssignmentCard";
import { AssignmentCardSkeleton } from "@/components/AssignmentCardSkeleton";
import { useAssignmentStore } from "@/lib/assignmentStore";
import { IconPlus, IconSearch } from "@/components/icons";

const filters = [
  { id: "all", label: "All" },
  { id: "done", label: "Ready" },
  { id: "processing", label: "Generating" },
  { id: "pending", label: "Draft" },
  { id: "failed", label: "Failed" },
] as const;

function EmptyStateIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="max-w-full"
    >
      <rect x="28" y="16" width="64" height="80" rx="6" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
      <path d="M40 36h40M40 48h32M40 60h36M40 72h24" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
      <circle cx="84" cy="84" r="18" fill="#FEE2E2" stroke="#FCA5A5" strokeWidth="2" />
      <path d="M77 77l14 14M91 77L77 91" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function AssignmentsPage() {
  const { assignments, loading, fetchAssignments, deleteAssignment } =
    useAssignmentStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      const matchesSearch =
        !search || a.title.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || a.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [assignments, search, filter]);

  const showToolbar = assignments.length > 0;

  return (
    <AppShell>
      <div className="border-b border-gray-100 bg-white px-4 py-4 md:px-8 md:py-6">
        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Assignments</h1>
        <div className="mt-1.5 flex items-start gap-2">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1B4332]" aria-hidden />
          <p className="text-sm text-gray-500">
            Manage and create assignments for your classes.
          </p>
        </div>
      </div>

      <main className="flex-1 overflow-x-hidden px-4 py-4 md:px-8 md:py-8">
        {showToolbar && (
          <div className="mb-6 space-y-4 md:mb-8 md:flex md:flex-row md:items-center md:justify-between md:space-y-0">
            <div
              className="-mx-4 flex snap-x snap-mandatory gap-1 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden"
            >
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`shrink-0 snap-start px-4 py-2.5 text-sm md:py-1.5 ${
                    filter === f.id
                      ? "rounded-full bg-[#1B4332] font-medium text-white"
                      : "text-gray-600 hover:underline"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:max-w-xs md:shrink-0">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search Assignment"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332] md:py-2"
              />
            </div>
          </div>
        )}

        {loading && assignments.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <AssignmentCardSkeleton key={i} />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-center px-2 py-12 text-center md:py-20">
            <EmptyStateIllustration />
            <h2 className="mt-8 text-xl font-bold text-gray-900">No assignments yet</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              Create your first assignment to start collecting and grading student
              submissions. You can set up rubrics, define marking criteria, and let
              AI assist with grading.
            </p>
            <Link
              href="/assignments/create"
              className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              <IconPlus className="h-4 w-4" />
              Create Your First Assignment
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center md:py-20">
            <p className="text-sm text-gray-500">No assignments match your search or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((a) => (
              <AssignmentCard
                key={a._id}
                assignment={a}
                onDelete={(id) => deleteAssignment(id)}
              />
            ))}
          </div>
        )}

        {assignments.length > 0 && (
          <Link
            href="/assignments/create"
            className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1B4332] text-white shadow-lg hover:bg-[#153528] md:hidden"
            aria-label="Create assignment"
          >
            <IconPlus className="h-6 w-6" />
          </Link>
        )}
      </main>
    </AppShell>
  );
}
