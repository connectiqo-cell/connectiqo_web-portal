"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { DashboardHome } from "@/components/home/DashboardHome";
import { useAuth } from "@/contexts/AuthContext";
import type { MentorProfileRow } from "@/lib/api/mentorApi";
import { ROUTES } from "@/lib/routes";

/** Where a logged-out visitor is sent instead of the old in-app MarketingHome — that page now lives here. */
const MARKETING_SITE_URL = "https://connectiqo.com/";

export function HomeGate({ trending }: { trending: MentorProfileRow[] }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const loggedOut = !loading && !user;
  // Brands have no use for this page — it's upcoming mentor sessions,
  // trending creators and interest-matched video recommendations, none of
  // which applies to a company account. Brand nav skips "Home" entirely and
  // treats Campaigns as the real landing page, so redirect here too for
  // anyone who lands on "/" directly (bookmark, back button, typed URL).
  const isBrand = profile?.role === "brand";

  useEffect(() => {
    if (loggedOut) window.location.href = MARKETING_SITE_URL;
  }, [loggedOut]);

  useEffect(() => {
    if (isBrand) router.replace(ROUTES.brandCampaigns);
  }, [isBrand, router]);

  // Only render DashboardHome once auth has actually resolved to a logged-in,
  // non-brand user — otherwise a logged-out visitor would see a flash of
  // dashboard content (which assumes a real user) during the moment auth is
  // still loading, before the redirect effects above fire.
  if (!loading && user && !isBrand) return <DashboardHome trending={trending} />;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24 text-sm text-text-muted">
      {loggedOut ? "Redirecting…" : ""}
    </div>
  );
}
