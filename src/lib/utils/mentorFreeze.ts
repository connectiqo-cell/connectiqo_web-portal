/** Mentor-side freeze helpers (timed suspension, not full account ban). */

export type MentorFreezeFlags = {
  mentor_frozen?: boolean | null;
  mentor_frozen_until?: string | null;
  mentor_freeze_reason?: string | null;
  frozen?: boolean | null;
  frozenUntil?: string | null;
};

export function isMentorFreezeActive(rowOrFlags: MentorFreezeFlags | null | undefined): boolean {
  if (!rowOrFlags) return false;
  const frozen = rowOrFlags.mentor_frozen === true || rowOrFlags.frozen === true;
  if (!frozen) return false;
  const until = rowOrFlags.mentor_frozen_until ?? rowOrFlags.frozenUntil ?? null;
  if (!until) return true;
  const end = new Date(until).getTime();
  if (Number.isNaN(end)) return true;
  return end > Date.now();
}

export function formatMentorFreezeUntil(until: string | null | undefined): string {
  if (!until) return "indefinitely";
  try {
    return new Date(until).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(until);
  }
}

/** PostgREST filter: rows that are not currently mentor-frozen. */
export function mentorNotFrozenOrFilter(): string {
  const nowIso = new Date().toISOString();
  return `mentor_frozen.eq.false,mentor_frozen_until.lt.${nowIso}`;
}
