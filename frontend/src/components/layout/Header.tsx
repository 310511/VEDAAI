"use client";

import Link from "next/link";
import { IconChevronLeft } from "@/components/icons";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, showBack, subtitle, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur-md md:top-0">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-8 md:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {showBack && (
            <Link
              href="/assignments"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-border-strong hover:bg-canvas hover:text-ink"
              aria-label="Back to assignments"
            >
              <IconChevronLeft />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-semibold tracking-tight text-ink md:text-[1.35rem]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="hidden shrink-0 items-center gap-2 md:flex">{actions}</div>
        )}
      </div>
    </header>
  );
}
