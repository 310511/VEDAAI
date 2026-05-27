"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconClipboard } from "@/components/icons";

const navItems = [
  { href: "/assignments", label: "Assignments", icon: IconClipboard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-[15.5rem] shrink-0 flex-col border-r border-border bg-surface min-h-screen">
      <div className="border-b border-border px-6 py-7">
        <Link href="/assignments" className="group block">
          <span className="font-display text-[1.35rem] font-semibold tracking-tight text-ink">
            Veda<span className="text-accent">AI</span>
          </span>
          <span className="mt-1 block text-xs text-subtle tracking-wide uppercase">
            Assessment Studio
          </span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              <Icon className={isActive ? "text-accent" : "text-subtle"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <Link
          href="/assignments/create"
          className="flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          New assignment
        </Link>
      </div>
    </aside>
  );
}
