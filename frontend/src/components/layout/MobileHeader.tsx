"use client";

import Link from "next/link";
import { IconBell } from "@/components/icons";

export function MobileHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
      <Link href="/assignments" className="font-display text-lg font-semibold text-gray-900">
        Veda<span className="text-[#1B4332]">AI</span>
      </Link>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 hover:bg-gray-50"
          aria-label="Notifications"
        >
          <IconBell />
        </button>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E2EEED] text-sm font-semibold text-[#1B4332]"
          aria-hidden
        >
          U
        </div>
      </div>
    </header>
  );
}
