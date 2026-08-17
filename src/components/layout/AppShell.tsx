"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { DashboardSidebar } from "@/components/home/DashboardSidebar";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { useAuth } from "@/contexts/AuthContext";

/** Routes that keep their own full-bleed layout — no persistent app chrome. */
const NO_SIDEBAR_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/onboarding",
  "/call",
  "/admin",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close the mobile drawer whenever the route changes (e.g. browser back/forward while
  // it's open) — compared during render rather than in an effect, per React's guidance on
  // adjusting state when a prop changes without an extra render pass.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileNavOpen(false);
  }

  const showSidebar =
    !loading && !!user && !NO_SIDEBAR_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!showSidebar) return <>{children}</>;

  return (
    <div className="flex flex-1 flex-col">
      <AppTopBar onMenuClick={() => setMobileNavOpen(true)} />
      <div className="flex flex-1">
        <DashboardSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
