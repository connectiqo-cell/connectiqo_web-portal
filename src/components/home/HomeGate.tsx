"use client";

import { useEffect } from "react";

import { DashboardHome } from "@/components/home/DashboardHome";
import { useAuth } from "@/contexts/AuthContext";
import type { MentorProfileRow } from "@/lib/api/mentorApi";

/** Where a logged-out visitor is sent instead of the old in-app MarketingHome — that page now lives here. */
const MARKETING_SITE_URL = "https://connectiqo.com/";

export function HomeGate({ trending }: { trending: MentorProfileRow[] }) {
  const { user, loading } = useAuth();
  const loggedOut = !loading && !user;

  useEffect(() => {
    if (loggedOut) window.location.href = MARKETING_SITE_URL;
  }, [loggedOut]);

  // Only render DashboardHome once auth has actually resolved to a logged-in
  // user — otherwise a logged-out visitor would see a flash of dashboard
  // content (which assumes a real user) during the moment auth is still
  // loading, before `loggedOut` flips true and the redirect above fires.
  if (!loading && user) return <DashboardHome trending={trending} />;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24 text-sm text-text-muted">
      {loggedOut ? "Redirecting…" : ""}
    </div>
  );
}
