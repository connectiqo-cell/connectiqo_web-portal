"use client";

import { DashboardHome } from "@/components/home/DashboardHome";
import { MarketingHome } from "@/components/home/MarketingHome";
import { useAuth } from "@/contexts/AuthContext";
import type { MentorCategoryRow } from "@/lib/api/contentApi";
import type { MentorProfileRow, PlatformStats } from "@/lib/api/mentorApi";

export function HomeGate(props: {
  trending: MentorProfileRow[];
  spotlight: MentorProfileRow[];
  stats: PlatformStats;
  categories: MentorCategoryRow[];
}) {
  const { trending, stats, categories } = props;
  const { user, loading } = useAuth();

  if (!loading && user) return <DashboardHome trending={trending} />;

  return <MarketingHome trending={trending} stats={stats} categories={categories} />;
}
