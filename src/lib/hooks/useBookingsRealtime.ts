"use client";

import { useEffect, useRef } from "react";

import { createClient } from "@/lib/supabase/client";

// A single call-end can fire two separate UPDATEs on the same booking row in
// quick succession (status -> "completed", then meeting_id cleared — see
// CallRoom.tsx's handleLeave) — each is its own postgres_changes event.
// Without debouncing, that alone doubles every reload this hook triggers.
const DEBOUNCE_MS = 800;

/**
 * Subscribes to any change on `bookings` rows where the given user is the
 * mentor or the learner, and calls `onChange` when one happens. Used to keep
 * booking lists live instead of only refreshing on next page load — the
 * mobile app's 19april2026 note flagged this as still missing there too.
 */
export function useBookingsRealtime(userId: string | undefined, onChange: () => void) {
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
      .channel(`bookings-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `mentor_id=eq.${userId}` },
        triggerDebounced,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `learner_id=eq.${userId}` },
        triggerDebounced,
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
