import { HomeGate } from "@/components/home/HomeGate";
import { fetchActiveCategories } from "@/lib/api/contentApi";
import { mentorApi } from "@/lib/api/mentorApi";
import { createPublicClient } from "@/lib/supabase/publicClient";

export const revalidate = 300;

export default async function Home() {
  const supabase = createPublicClient();
  const [trending, stats, categories] = await Promise.all([
    mentorApi.getTrendingMentors(supabase, 8).catch(() => []),
    mentorApi.getPlatformStats(supabase),
    fetchActiveCategories(supabase),
  ]);
  const spotlight = trending.slice(0, 4);

  return <HomeGate trending={trending} spotlight={spotlight} stats={stats} categories={categories} />;
}
