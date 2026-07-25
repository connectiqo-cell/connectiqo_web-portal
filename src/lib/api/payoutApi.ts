import { createClient } from "@/lib/supabase/client";

export interface AccountStatusResponse {
  status: "not_started" | "active" | "suspended" | "needs_clarification" | "pending";
  accountId: string | null;
  upiId: string | null;
}

/** Ported from connectfront/src/api/payoutApi.js — Razorpay Route linked-account setup. */
export const payoutApi = {
  createLinkedAccount: async (params: {
    mentorId: string;
    legalName: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    upiId?: string;
  }) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.functions.invoke("create-linked-account", {
        body: params,
      });
      if (error) throw new Error(error.message || "Failed to create payout account");
      return data;
    } catch (error) {
      throw new Error((error as Error)?.message || "Failed to create payout account");
    }
  },

  getAccountStatus: async (mentorId: string): Promise<AccountStatusResponse> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.functions.invoke("get-account-status", {
        body: { mentorId },
      });
      if (error) throw new Error(error.message || "Failed to fetch account status");
      return data as AccountStatusResponse;
    } catch (error) {
      throw new Error((error as Error)?.message || "Failed to fetch account status");
    }
  },
};
