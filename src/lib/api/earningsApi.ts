import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorHandler";

export interface EarningRow {
  id: string;
  amount: string | number;
  status: string;
  created_at: string;
  booking_id: string;
  bookings: {
    id: string;
    learner_id: string;
    created_at: string;
    profiles: { name: string | null } | null;
  } | null;
}

/** Ported (subset used by the mentor earnings dashboard) from connectfront/src/api/earningsApi.js. */
export const earningsApi = {
  getEarningsByMentor: async (mentorId: string): Promise<EarningRow[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("earnings")
        .select(
          `*, bookings ( id, learner_id, created_at, profiles!learner_id ( name ) )`,
        )
        .eq("mentor_id", mentorId)
        .neq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as EarningRow[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Last 7 days of credited earnings, grouped by day — powers the dashboard bar chart. */
  getEarningsByWeek: async (mentorId: string): Promise<{ date: string; amount: number }[]> => {
    const supabase = createClient();
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6);
      const startStr = weekStart.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("earnings")
        .select("amount, created_at")
        .eq("mentor_id", mentorId)
        .neq("status", "pending")
        .gte("created_at", startStr);
      if (error) throw error;

      const grouped: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        grouped[d.toISOString().split("T")[0]] = 0;
      }
      (data || []).forEach((earning) => {
        const day = earning.created_at.split("T")[0];
        if (day in grouped) grouped[day] += parseFloat(String(earning.amount));
      });

      return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getTotalEarnings: async (mentorId: string): Promise<number> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("earnings")
        .select("amount")
        .eq("mentor_id", mentorId)
        .eq("status", "completed");
      if (error) throw error;
      return (data || []).reduce((sum, e) => sum + parseFloat(String(e.amount)), 0);
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
