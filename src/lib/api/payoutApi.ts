import { createClient } from "@/lib/supabase/client";

export interface AccountStatusResponse {
  status: "not_started" | "active";
  accountId: string | null;
  upiId: string | null;
  bankAccount: string | null;
  ifsc: string | null;
  accountHolderName: string | null;
}

/** Manual payout model — no Razorpay account, just saved UPI and/or bank details. */
export const payoutApi = {
  createLinkedAccount: async (params: {
    mentorId: string;
    upiId?: string;
    bankAccount?: string;
    ifsc?: string;
    accountHolderName?: string;
  }) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.functions.invoke("create-linked-account", {
        body: params,
      });
      if (error) throw new Error(error.message || "Failed to save payout details");
      return data;
    } catch (error) {
      throw new Error((error as Error)?.message || "Failed to save payout details");
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
