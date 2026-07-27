/** Normalize HH:MM:SS or HH:MM to HH:MM for comparisons. */
export function normalizeSlotTime(time: string | null | undefined): string {
  if (!time) return "";
  return String(time).substring(0, 5);
}

interface SlotTimes {
  start_time: string;
  end_time: string;
}

/** True when sorted slots form one continuous block (each end equals next start). */
export function areSlotsContiguous(slots: SlotTimes[]): boolean {
  if (slots.length <= 1) return true;
  const sorted = [...slots].sort((a, b) =>
    normalizeSlotTime(a.start_time).localeCompare(normalizeSlotTime(b.start_time)),
  );
  for (let i = 0; i < sorted.length - 1; i += 1) {
    if (normalizeSlotTime(sorted[i].end_time) !== normalizeSlotTime(sorted[i + 1].start_time)) {
      return false;
    }
  }
  return true;
}

/** Total duration in minutes across a contiguous block of slots. */
export function slotDurationMinutes(start: string, end: string): number {
  const [sh, sm] = normalizeSlotTime(start).split(":").map(Number);
  const [eh, em] = normalizeSlotTime(end).split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}
