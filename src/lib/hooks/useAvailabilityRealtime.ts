"use client";

import { useEffect, useRef } from "react";

import { createClient } from "@/lib/supabase/client";

const DEBOUNCE_MS = 500;

/**
 * Subscribes to any change on `availability_slots` rows for the given
 * mentor, and calls `onChange` when one happens. Without this, a learner's
 * already-loaded slot list goes stale the moment someone else books a slot
 * out from under them — they can select it, pay, and only then get rejected
 * (see note.txt #4: "Same time slot says after booking & payments show
 * booked by another").
 */
export function useAvailabilityRealtime(mentorId: string | undefined, onChange: () => void) {
  const onChangeRef = useRef(onChange);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!mentorId) return;

    const triggerDebounced = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => onChangeRef.current(), DEBOUNCE_MS);
    };

    const supabase = createClient();
    const channel = supabase
      .channel(`availability-${mentorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "availability_slots", filter: `mentor_id=eq.${mentorId}` },
        triggerDebounced,
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [mentorId]);
}
