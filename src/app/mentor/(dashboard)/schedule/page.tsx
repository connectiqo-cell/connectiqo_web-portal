"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { availabilityApi, type AvailabilitySlot } from "@/lib/api/availabilityApi";

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

export default function MentorSchedulePage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const loadSlots = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await availabilityApi.getAvailabilityForMentor(user.id);
      const today = new Date().toISOString().split("T")[0];
      setSlots(rows.filter((s) => s.date >= today));
    } catch (err) {
      setError((err as Error)?.message || "Could not load availability");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void Promise.resolve().then(() => loadSlots());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAdd = async () => {
    if (!user || !date || !startTime || !endTime) return;
    if (endTime <= startTime) {
      setError("End time must be after start time");
      return;
    }
    setAdding(true);
    setError("");
    try {
      await availabilityApi.addAvailabilitySlot({
        mentorId: user.id,
        date,
        startTime,
        endTime,
      });
      await loadSlots();
    } catch (err) {
      setError((err as Error)?.message || "Could not add slot");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    try {
      await availabilityApi.deleteAvailabilitySlot(slotId);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch (err) {
      setError((err as Error)?.message || "Could not remove slot");
    }
  };

  const grouped = slots.reduce<Record<string, AvailabilitySlot[]>>((acc, slot) => {
    (acc[slot.date] ??= []).push(slot);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
        <h2 className="text-sm font-semibold text-text-primary">Add a slot</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            type="date"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-border-light bg-surface-sheet px-3 py-2 text-sm text-text-primary focus:outline-none"
          />
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="rounded-xl border border-border-light bg-surface-sheet px-3 py-2 text-sm text-text-primary focus:outline-none"
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="rounded-xl border border-border-light bg-surface-sheet px-3 py-2 text-sm text-text-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !date}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-accent-link/15 px-3 py-2 text-sm font-semibold text-accent-link disabled:opacity-50"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        {error ? <p className="text-sm text-accent-error">{error}</p> : null}
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : dates.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          No upcoming availability. Add a slot above.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {dates.map((d) => (
            <div key={d} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-text-secondary">{formatDateLabel(d)}</h3>
              <div className="flex flex-wrap gap-2">
                {grouped[d].map((slot) => (
                  <div
                    key={slot.id}
                    className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                      slot.is_booked
                        ? "border-accent-success/40 bg-accent-success/10 text-accent-success"
                        : "border-border-light text-text-secondary"
                    }`}
                  >
                    {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                    {slot.is_booked ? (
                      <span className="text-[10px] uppercase">Booked</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDelete(slot.id)}
                        aria-label="Remove slot"
                        className="text-text-muted hover:text-accent-error"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
