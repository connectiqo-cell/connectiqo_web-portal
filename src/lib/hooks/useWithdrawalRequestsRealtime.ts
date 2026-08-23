"use client";

import { useEffect, useRef } from "react";

import { createClient } from "@/lib/supabase/client";

const DEBOUNCE_MS = 800;

/**
 * Subscribes to changes on `withdrawal_requests` rows for the given mentor
 * and calls `onChange` when one happens — keeps the wallet page's withdrawal
 * status live when an admin marks a request processing/completed/rejected.
 * Mirrors useBookingsRealtime.
 */
export function useWithdrawalRequestsRealtime(userId: string | undefined, onChange: () => void) {
  const onChangeRef = useRef(onChange);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!userId) return;

    const triggerDebounced = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => onChangeRef.current(), DEBOUNCE_MS);
    };

    const supabase = createClient();
    const channel = supabase
      .channel(`withdrawals-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "withdrawal_requests", filter: `mentor_id=eq.${userId}` },
        triggerDebounced,
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
