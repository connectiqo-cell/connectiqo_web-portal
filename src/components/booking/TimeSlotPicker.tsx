"use client";

function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function minutesToTime(mins: number): string {
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export interface BusyInterval {
  start: string;
  end: string;
}

/**
 * Free-pick time picker for the reschedule flow — generates candidate start
 * times for a fixed session duration rather than binding to real
 * availability_slots rows (BookingFlow's pills are bound to those, a
 * different data shape that carries slot IDs for contiguous selection).
 * This is a client-side UX pre-check only; propose_reschedule_slot enforces
 * duration/conflict rules server-side regardless of what's shown here.
 */
export function TimeSlotPicker({
  date,
  durationMinutes,
  busyIntervals,
  selectedStartTime,
  onSelect,
  dayStartMinutes = 360,
  dayEndMinutes = 1380,
  stepMinutes = 30,
}: {
  date: string;
  durationMinutes: number;
  busyIntervals: BusyInterval[];
  selectedStartTime: string | null;
  onSelect: (start: string) => void;
  /** Defaults to 06:00–23:00 in 30-minute steps. */
  dayStartMinutes?: number;
  dayEndMinutes?: number;
  stepMinutes?: number;
}) {
  const now = new Date();
  const isToday = date === toDateStr(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const candidates: number[] = [];
  for (let start = dayStartMinutes; start + durationMinutes <= dayEndMinutes; start += stepMinutes) {
    candidates.push(start);
  }

  const isDisabled = (startMin: number) => {
    if (isToday && startMin <= nowMinutes) return true;
    const endMin = startMin + durationMinutes;
    return busyIntervals.some((b) => {
      const busyStart = timeToMinutes(b.start);
      const busyEnd = timeToMinutes(b.end);
      return startMin < busyEnd && endMin > busyStart;
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {candidates.map((startMin) => {
        const startTime = minutesToTime(startMin);
        const disabled = isDisabled(startMin);
        const selected = selectedStartTime === startTime;
        return (
          <button
            key={startTime}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(startTime)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              selected
                ? "border-accent-link/50 bg-accent-link/15 text-accent-link"
                : disabled
                  ? "cursor-not-allowed border-border-light text-text-disabled"
                  : "border-border-light text-text-secondary hover:text-text-primary"
            }`}
          >
            {formatTime(startTime)}
          </button>
        );
      })}
    </div>
  );
}
