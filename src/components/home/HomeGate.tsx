"use client";

import { DashboardHome } from "@/components/home/DashboardHome";
import { MarketingHome } from "@/components/home/MarketingHome";
import { useAuth } from "@/contexts/AuthContext";
import type { MentorProfileRow, PlatformStats } from "@/lib/api/mentorApi";

export function HomeGate({
  trending,
  spotlight,
  stats,
}: {
  trending: MentorProfileRow[];
  spotlight: MentorProfileRow[];
  stats: PlatformStats;
}) {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <DashboardHome trending={trending} stats={stats} />;
  }

  return <MarketingHome />;
}
