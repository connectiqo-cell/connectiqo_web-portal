import { HomeGate } from "@/components/home/HomeGate";
import { mentorApi } from "@/lib/api/mentorApi";
import { createPublicClient } from "@/lib/supabase/publicClient";

export const revalidate = 300;

export default async function Home() {
  const supabase = createPublicClient();
  const [trending, stats] = await Promise.all([
    mentorApi.getTrendingMentors(supabase, 8).catch(() => []),
    mentorApi.getPlatformStats(supabase),
  ]);
  const spotlight = trending.slice(0, 4);

  return <HomeGate trending={trending} spotlight={spotlight} stats={stats} />;
}
