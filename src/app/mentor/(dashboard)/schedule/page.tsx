"use client";

import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { availabilityApi, type AvailabilitySlot } from "@/lib/api/availabilityApi";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const SLOT_DURATION_MINS = 20;
const SLOT_BUFFER_MINS = 30;

const SLOT_PERIODS = [
  { id: "night", label: "Night", hint: "12:00 – 5:30 AM", startHour: 0, endHour: 6 },
  { id: "morning", label: "Morning", hint: "6:00 – 11:30 AM", startHour: 6, endHour: 12 },
  { id: "afternoon", label: "Afternoon", hint: "12:00 – 4:30 PM", startHour: 12, endHour: 17 },
  { id: "evening", label: "Evening", hint: "5:00 – 9:30 PM", startHour: 17, endHour: 22 },
  { id: "late_night", label: "Late Night", hint: "10:00 – 11:30 PM", startHour: 22, endHour: 24 },
] as const;

const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 0; h <= 23; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
})();

function toDateStr(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function slotKey(start: string) {
  return `${start}-${addMinutes(start, SLOT_DURATION_MINS)}`;
}

function isTimeInPast(dateStr: string, timeStr: string, todayStr: string) {
  if (dateStr !== todayStr) return false;
  const now = new Date();
  const [h, m] = timeStr.split(":").map(Number);
  const slotTime = new Date();
  slotTime.setHours(h, m, 0, 0);
  return slotTime.getTime() - now.getTime() < SLOT_BUFFER_MINS * 60 * 1000;
}

export default function MentorSchedulePage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [justPublished, setJustPublished] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const loadSlots = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await availabilityApi.getAvailabilityForMentor(user.id);
      setSlots(rows.filter((s) => s.date >= todayStr));
    } catch (err) {
      setError((err as Error)?.message || "Could not load schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void Promise.resolve().then(() => loadSlots());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const grouped = useMemo(
    () =>
      slots.reduce<Record<string, AvailabilitySlot[]>>((acc, slot) => {
        (acc[slot.date] ??= []).push(slot);
        return acc;
      }, {}),
    [slots],
  );

  const existingForDate = useMemo(() => grouped[selectedDate] || [], [grouped, selectedDate]);
  const bookedKeysForDate = useMemo(
    () =>
      new Set(
        existingForDate
          .filter((s) => s.is_booked)
          .map((s) => `${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`),
      ),
    [existingForDate],
  );

  const initialKeysForDate = useMemo(
    () =>
      new Set(
        existingForDate
          .filter((s) => !s.is_booked)
          .map((s) => `${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`),
      ),
    [existingForDate],
  );

  // Reset the toggle-grid selection whenever the selected date (or its
  // loaded slots) changes, seeding it from what's already saved. Deferred to
  // a microtask so this reacts to the derived value changing rather than
  // setting state synchronously inside the effect body.
  useEffect(() => {
    void Promise.resolve().then(() => setSelectedKeys(new Set(initialKeysForDate)));
  }, [initialKeysForDate]);
  const hasUnsavedChanges =
    selectedKeys.size !== initialKeysForDate.size ||
    [...selectedKeys].some((k) => !initialKeysForDate.has(k));

  const handleToggle = (start: string) => {
    const key = slotKey(start);
    if (bookedKeysForDate.has(key)) return;
    if (isTimeInPast(selectedDate, start, todayStr)) return;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setJustPublished(false);
  };

  const handlePublish = async () => {
    if (!user) return;
    setPublishing(true);
    setError("");
    try {
      const desired = [...selectedKeys].map((key) => {
        const [startTime, endTime] = key.split("-");
        return { startTime, endTime };
      });
      await availabilityApi.syncSlotsForDate({
        mentorId: user.id,
        date: selectedDate,
        existing: existingForDate,
        desired,
      });
      await loadSlots();
      setJustPublished(true);
      setTimeout(() => setJustPublished(false), 2500);
    } catch (err) {
      setError((err as Error)?.message || "Could not publish schedule");
    } finally {
      setPublishing(false);
    }
  };

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const isPrevDisabled = year === new Date().getFullYear() && month === new Date().getMonth();

  const periodBuckets = SLOT_PERIODS.map((period) => ({
    period,
    items: TIME_SLOTS.filter((t) => {
      const h = Number(t.split(":")[0]);
      return h >= period.startHour && h < period.endHour;
    }),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Pick a date</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (isPrevDisabled) return;
                setMonthCursor(new Date(year, month - 1, 1));
              }}
              disabled={isPrevDisabled}
              aria-label="Previous month"
              className="rounded-lg p-1 text-text-secondary hover:text-text-primary disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[9rem] text-center text-xs font-semibold text-text-secondary">
              {monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() => setMonthCursor(new Date(year, month + 1, 1))}
              aria-label="Next month"
              className="rounded-lg p-1 text-text-secondary hover:text-text-primary"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-text-muted">
          {DAY_LABELS.map((label, i) => (
            <span key={`${label}-${i}`}>{label}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />;
            const cellDate = new Date(year, month, day);
            const cellStr = toDateStr(cellDate);
            const isPast = cellStr < todayStr;
            const isSelected = cellStr === selectedDate;
            const isToday = cellStr === todayStr;
            const openCount = grouped[cellStr]?.filter((s) => !s.is_booked).length || 0;
            const bookedCount = grouped[cellStr]?.filter((s) => s.is_booked).length || 0;

            return (
              <button
                key={cellStr}
                type="button"
                disabled={isPast}
                onClick={() => setSelectedDate(cellStr)}
                className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-30 ${
                  isSelected
                    ? "bg-accent-link text-text-on-accent font-semibold"
                    : isToday
                      ? "border border-accent-link/50 text-text-primary"
                      : "text-text-secondary hover:bg-surface-chip"
                }`}
              >
                {day}
                {openCount > 0 || bookedCount > 0 ? (
                  <span
                    className={`h-1 w-1 rounded-full ${
                      isSelected ? "bg-text-on-accent" : bookedCount > 0 ? "bg-accent-warning" : "bg-accent-success"
                    }`}
                  />
                ) : (
                  <span className="h-1 w-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-border-light bg-surface-panel p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{formatDateLabel(selectedDate)}</h3>
            <p className="text-xs text-text-muted">Tap to toggle · 20 min sessions</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-text-muted">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full border border-border-default bg-surface-chip" /> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full border border-accent-link bg-accent-link/20" /> Selected
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full border border-accent-warning bg-accent-warning/20" /> Booked
            </span>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : (
          <div className="flex flex-col gap-5">
            {periodBuckets.map(({ period, items }) => (
              <div key={period.id} className="flex flex-col gap-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    {period.label}
                  </h4>
                  <p className="text-[11px] text-text-muted">{period.hint}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {items.map((start) => {
                    const end = addMinutes(start, SLOT_DURATION_MINS);
                    const key = slotKey(start);
                    const isBooked = bookedKeysForDate.has(key);
                    const isPast = isTimeInPast(selectedDate, start, todayStr);
                    const isSelected = selectedKeys.has(key);
                    const disabled = isBooked || isPast;

                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleToggle(start)}
                        className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border px-1.5 py-2 text-[11px] font-semibold disabled:cursor-not-allowed ${
                          isBooked
                            ? "border-accent-warning/50 bg-accent-warning/10 text-accent-warning"
                            : isPast
                              ? "border-border-light bg-surface-sheet text-text-muted opacity-50"
                              : isSelected
                                ? "border-accent-link bg-accent-link/15 text-accent-link"
                                : "border-border-light text-text-secondary hover:border-accent-link/40"
                        }`}
                      >
                        {isBooked ? <Lock size={10} /> : null}
                        <span>{formatTime(start)}</span>
                        <span className="text-[9px] opacity-70">to {formatTime(end)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {error ? <p className="text-sm text-accent-error">{error}</p> : null}

        <div className="flex items-center justify-between border-t border-border-light pt-4">
          <div>
            <p className="text-xs font-semibold text-text-muted">
              {hasUnsavedChanges ? "Unsaved changes" : "Up to date"}
            </p>
            <p className="text-sm font-bold text-text-primary">{selectedKeys.size} slot(s) selected</p>
          </div>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing || loading || (!hasUnsavedChanges && !justPublished)}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-text-on-accent disabled:opacity-50"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            {publishing ? "Saving…" : justPublished ? "Published!" : "Publish schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
