"use client";

import { useEffect, useRef, useState } from "react";

import { computeSessionTiming, formatCountdown } from "@/lib/utils/sessionSlotTimer";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

/** Isolated 1 Hz timer so the call grid/controls don't re-render every second. */
export function CallSessionTimer({
  slot,
}: {
  slot?: { date?: string | null; start_time?: string | null; end_time?: string | null } | null;
}) {
  const hasSlotTimer = Boolean(slot?.date);
  const meetingStartedAtRef = useRef<number | null>(null);
  const [meetingElapsedSeconds, setMeetingElapsedSeconds] = useState(0);
  const [sessionTiming, setSessionTiming] = useState(() => computeSessionTiming(slot || {}));

  useEffect(() => {
    meetingStartedAtRef.current = Date.now();
  }, []);

  useEffect(() => {

    const tick = () => {
      const startedAt = meetingStartedAtRef.current ?? Date.now();
      setMeetingElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      if (slot?.date) setSessionTiming(computeSessionTiming(slot));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [slot]);

  const value = hasSlotTimer
    ? sessionTiming.status === "upcoming"
      ? formatCountdown(sessionTiming.untilStartSec)
      : sessionTiming.status === "live"
        ? formatCountdown(sessionTiming.remainingSec)
        : "00:00"
    : formatDuration(meetingElapsedSeconds);

  const label = hasSlotTimer
    ? sessionTiming.status === "upcoming"
      ? "Starts in"
      : sessionTiming.status === "live"
        ? "Time left"
        : "Ended"
    : null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-border-light bg-surface-sheet px-3 py-1.5">
      {hasSlotTimer && sessionTiming.status === "live" ? (
        <span className="h-1.5 w-1.5 rounded-full bg-accent-success" />
      ) : null}
      <div className="flex flex-col leading-tight">
        {label ? <span className="text-[10px] font-medium text-text-muted">{label}</span> : null}
        <span className="font-mono text-sm font-bold tabular-nums text-text-primary">{value}</span>
      </div>
    </div>
  );
}
