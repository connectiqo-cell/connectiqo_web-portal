import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorHandler";

async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let detail = error.message;
    try {
      const errBody = await (error as { context?: { json?: () => Promise<{ error?: string }> } })
        .context?.json?.();
      if (errBody?.error) detail = errBody.error;
    } catch {
      // ignore parse failure — fall back to error.message
    }
    throw new Error(detail);
  }
  return data as T;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  routeEnabled: boolean;
  mentorAmount: number;
  convenienceFee: number;
  totalAmount: number;
  platformFeePercent: number;
  gstPercent: number;
  slotCount: number;
}

export interface VerifyAndBookResponse {
  success: boolean;
  bookingId: string;
  bookingIds: string[];
}

export interface TransactionRow {
  id: string;
  status: string;
  created_at: string;
  learner_id: string;
  mentor_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount_total_paise: number;
  platform_fee_paise: number;
  mentor_earning_paise: number;
}

export interface WithdrawalRequestRow {
  id: string;
  amount: number;
  upi_id: string | null;
  status: string;
  created_at: string;
}

/** Ported (subset used by booking/checkout) from connectfront/src/api/paymentApi.js. */
export const paymentApi = {
  /**
   * Step 1: create a Razorpay order — amounts are calculated server-side.
   * `slotIds` covers single or continuous multi-slot (same-day) checkout;
   * the function validates the block is contiguous and prices per slot.
   */
  createOrder: async (params: {
    mentorId: string;
    learnerId: string;
    slotIds: string[];
    message?: string;
    recordingRequested: boolean;
  }): Promise<CreateOrderResponse> => {
    try {
      return await invokeFunction<CreateOrderResponse>("create-razorpay-order", params);
    } catch (error) {
      throw new Error((error as Error)?.message || "Failed to create order");
    }
  },

  /** Step 2: verify payment + create the booking atomically, after Razorpay checkout succeeds. */
  verifyAndBook: async (params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    mentorId: string;
    learnerId: string;
    slotIds: string[];
    message?: string;
    recordingRequested: boolean;
  }): Promise<VerifyAndBookResponse> => {
    try {
      return await invokeFunction<VerifyAndBookResponse>("verify-razorpay-payment", params);
    } catch (error) {
      throw new Error((error as Error)?.message || "Payment verification failed");
    }
  },

  /** Mentor's wallet balance (available / pending / withdrawn totals). */
  getWallet: async (
    mentorId: string,
  ): Promise<{ balance: number; total_earned: number; total_withdrawn: number }> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("mentor_wallets")
        .select("balance, total_earned, total_withdrawn")
        .eq("id", mentorId)
        .maybeSingle();
      if (error) throw error;
      return data || { balance: 0, total_earned: 0, total_withdrawn: 0 };
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Triggers a RazorpayX UPI payout via Edge Function. */
  requestWithdrawal: async (params: { mentorId: string; amount: number }) => {
    try {
      return await invokeFunction("process-withdrawal", params);
    } catch (error) {
      throw new Error((error as Error)?.message || "Withdrawal failed");
    }
  },

  /** All paid transactions for a user, as either mentor or learner. */
  getTransactions: async (userId: string): Promise<TransactionRow[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          "id, status, created_at, learner_id, mentor_id, razorpay_order_id, razorpay_payment_id, amount_total_paise, platform_fee_paise, mentor_earning_paise",
        )
        .or(`learner_id.eq.${userId},mentor_id.eq.${userId}`)
        .eq("status", "paid")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as TransactionRow[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** A mentor's withdrawal requests, newest first. */
  getWithdrawalRequests: async (mentorId: string): Promise<WithdrawalRequestRow[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("id, amount, upi_id, status, created_at")
        .eq("mentor_id", mentorId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as WithdrawalRequestRow[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
