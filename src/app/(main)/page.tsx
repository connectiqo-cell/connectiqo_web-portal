import { HomeGate } from "@/components/home/HomeGate";
import { mentorApi } from "@/lib/api/mentorApi";
import { createPublicClient } from "@/lib/supabase/publicClient";

export const revalidate = 300;

export default async function Home() {
  const supabase = createPublicClient();
  const trending = await mentorApi.getTrendingMentors(supabase, 8).catch(() => []);

  return <HomeGate trending={trending} />;
}
