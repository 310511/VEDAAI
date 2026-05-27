import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";

interface AppShellProps {
  children: React.ReactNode;
  /** Hide global mobile top bar (create/result use their own headers) */
  hideMobileTopBar?: boolean;
}

export function AppShell({ children, hideMobileTopBar = false }: AppShellProps) {
  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <div
        className={`flex min-w-0 flex-1 flex-col pb-16 md:pb-0 ${
          hideMobileTopBar ? "" : "pt-14 md:pt-0"
        }`}
      >
        {!hideMobileTopBar && <MobileHeader />}
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
