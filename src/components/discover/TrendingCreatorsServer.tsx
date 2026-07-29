import { mentorApi } from "@/lib/api/mentorApi";
import { createPublicClient } from "@/lib/supabase/publicClient";
import { TrendingCreators } from "./TrendingCreators";

export async function TrendingCreatorsServer() {
  try {
    const supabase = createPublicClient();
    const mentors = await mentorApi.getTrendingMentors(supabase, 10);
    return <TrendingCreators mentors={mentors} />;
  } catch (error) {
    console.error("Failed to load trending mentors:", error);
    return null;
  }
}
