"use client";

import { usePathname } from "next/navigation";

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

  const showSidebar =
    !loading && !!user && !NO_SIDEBAR_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!showSidebar) return <>{children}</>;

  return (
    <div className="flex flex-1 flex-col">
      <AppTopBar />
      <div className="flex flex-1">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
