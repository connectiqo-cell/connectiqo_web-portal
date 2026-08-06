"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BookingCalendar({
  availableDates,
  selectedDate,
  onSelectDate,
}: {
  availableDates: string[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}) {
  const availableSet = new Set(availableDates);
  const initial = selectedDate || availableDates[0] || toDateStr(new Date());
  const [initialYear, initialMonth] = initial.split("-").map(Number);
  const [monthCursor, setMonthCursor] = useState(new Date(initialYear, initialMonth - 1, 1));

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayStr = toDateStr(new Date());

  return (
    <div className="rounded-2xl border border-border-light bg-surface-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthCursor(new Date(year, month - 1, 1))}
          aria-label="Previous month"
          className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-chip hover:text-text-primary"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-text-primary">
          {monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          onClick={() => setMonthCursor(new Date(year, month + 1, 1))}
          aria-label="Next month"
          className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-chip hover:text-text-primary"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-text-muted">
        {["S", "M", "T", "W", "T", "F", "S"].map((label, i) => (
          <span key={`${label}-${i}`}>{label}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateStr = toDateStr(new Date(year, month, day));
          const isAvailable = availableSet.has(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          return (
            <button
              key={dateStr}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelectDate(dateStr)}
              aria-pressed={isSelected}
              className={`flex h-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-accent-link text-text-on-accent"
                  : isAvailable
                    ? `text-text-primary hover:bg-surface-chip ${isToday ? "ring-1 ring-inset ring-accent-link/50" : ""}`
                    : "cursor-not-allowed text-text-disabled"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
