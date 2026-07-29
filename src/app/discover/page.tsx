import type { Metadata } from "next";
import { Suspense } from "react";

import { DiscoverView } from "@/components/discover/DiscoverView";
import { TrendingCreatorsServer } from "@/components/discover/TrendingCreatorsServer";
import { mentorApi } from "@/lib/api/mentorApi";
import { createPublicClient } from "@/lib/supabase/publicClient";

export const metadata: Metadata = {
  title: "Discover Mentors — Connectiqo",
  description: "Browse expert mentors across technology, business, design, and more on Connectiqo.",
};

export const revalidate = 300;

interface DiscoverPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const { q } = await searchParams;
  const supabase = createPublicClient();
  const grouped = await mentorApi.getMentorsByCategory(supabase).catch(() => ({}));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Discover Mentors</h1>
        <p className="mt-1 text-text-secondary">
          Find an expert for a live 1-on-1 session, browsed by category.
        </p>
      </div>
      <Suspense fallback={null}>
        <TrendingCreatorsServer />
      </Suspense>
      <DiscoverView grouped={grouped} initialQuery={q || ""} />
    </main>
  );
}
