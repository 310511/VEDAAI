"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import type { Assignment } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Props {
  assignment: Assignment;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function AssignmentCard({ assignment, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const href = `/assignments/${assignment._id}/result`;

  return (
    <article className="relative w-full rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-5">
      <div className="flex items-start justify-between gap-3">
        <Link href={href} className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 md:text-lg">
            {assignment.title}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {assignment.subject}
            <span className="mx-1.5">·</span>
            Class {assignment.grade}
          </p>
        </Link>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700"
            aria-label="More options"
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 z-20 min-w-[160px] rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
              <Link
                href={href}
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                View Assignment
              </Link>
              <button
                type="button"
                className="block w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-gray-50"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(assignment._id);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        <span className="block sm:inline">
          Assigned on: {formatDate(assignment.createdAt)}
        </span>
        <span className="hidden sm:inline">&nbsp;&nbsp;</span>
        <span className="block sm:inline">Due: {formatDate(assignment.dueDate)}</span>
      </p>

      <div className="mt-3">
        <StatusBadge status={assignment.status} />
      </div>
    </article>
  );
}
