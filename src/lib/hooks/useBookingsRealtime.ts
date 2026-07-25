"use client";

import { useEffect, useRef } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to any change on `bookings` rows where the given user is the
 * mentor or the learner, and calls `onChange` when one happens. Used to keep
 * booking lists live instead of only refreshing on next page load — the
 * mobile app's 19april2026 note flagged this as still missing there too.
 */
export function useBookingsRealtime(userId: string | undefined, onChange: () => void) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`bookings-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `mentor_id=eq.${userId}` },
        () => onChangeRef.current(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `learner_id=eq.${userId}` },
        () => onChangeRef.current(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
