"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconClipboard, IconHome, IconLibrary, IconSparkle } from "@/components/icons";
import { useAssignmentStore } from "@/lib/assignmentStore";

const tabs = [
  {
    href: "/assignments",
    label: "Home",
    icon: IconHome,
    match: (p: string) => p === "/assignments" || p === "/",
  },
  {
    href: "/assignments",
    label: "Assignments",
    icon: IconClipboard,
    match: (p: string) => p.startsWith("/assignments/"),
    showBadge: true,
  },
  { href: "#", label: "Library", icon: IconLibrary, match: () => false },
  { href: "#", label: "AI Toolkit", icon: IconSparkle, match: () => false },
];

export function MobileNav() {
  const pathname = usePathname();
  const count = useAssignmentStore((s) => s.assignments.length);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-gray-200 bg-white md:hidden">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        const Icon = tab.icon;
        const isAssignmentsTab = tab.label === "Assignments";

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-2 text-[10px] ${
              active ? "font-medium text-[#1B4332]" : "text-gray-400"
            }`}
          >
            <span className="relative">
              <Icon className={`h-5 w-5 ${active ? "text-[#1B4332]" : "text-gray-400"}`} />
              {isAssignmentsTab && tab.showBadge && count > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#1B4332] px-1 text-[9px] font-bold text-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </span>
            <span className={active ? "text-[#1B4332]" : "text-gray-400"}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
