# Booking Flow Audit

_Code Review — Read Only_

A line-by-line review of Connectiqo's booking lifecycle — from slot selection through payment, calls, rescheduling, and reviews — verified directly against the current `src/` and `supabase/migrations/` source, not assumed.

- **Scope:** booking creation → call → completion → payment → review
- **Files reviewed:** 14
- **Method:** direct source read, no code changed

## Lifecycle as built

1. Slot select + Razorpay checkout
2. Booking created (server-side)
3. Call window (host starts, learner waits)
4. Completed → wallet credited
5. Learner review

## Summary

| Confirmed bugs | Design gaps | Verify with team |
|---|---|---|
| 4 | 5 | 2 |

---

## Confirmed bugs

_Reproducible from the code as written — not edge-case speculation._

### 1. Reschedule proposals silently shrink long sessions to 20 minutes
**`mentor/reschedule/[bookingId]/page.tsx:13`** — Highest impact

Every proposed replacement slot uses a hardcoded `SESSION_DURATION_MINUTES = 20`, regardless of how long the original booking actually was. Multi-slot continuous bookings (40/60+ min) are fully supported elsewhere in the app, and the correct duration is already sitting on `booking.availability_slots.end_time` — the form just never reads it.

> **Concretely:** a learner who paid for a 60-minute session, whose mentor no-shows, gets proposed a 20-minute replacement with no adjustment, no warning, and no partial refund of the difference.

### 2. Cancelling a booking is fully built and completely unreachable
**`bookingApi.ts:412` · `BookingListItem.tsx:103`** — Missing feature

`bookingApi.cancelBooking()` correctly releases the slot before marking a booking cancelled, and `BookingListItem` already renders a Cancel button whenever it's given an `onCancel` prop. Neither the learner's `bookings/page.tsx` nor the mentor's `sessions/page.tsx` ever passes that prop.

> **Concretely:** there is currently no way for a learner or mentor to cancel an upcoming session anywhere in the web app, despite the backend logic for it already existing and working.

### 3. `clearMeetingId` is missing the exact RLS guard its sibling already has
**`bookingApi.ts:92–125`** — Inconsistent fix

`setMeetingId` has an explicit comment and check for a known failure mode: a stale session gets silently downgraded to the `anon` role, which has no UPDATE policy on `bookings` — Postgres returns a clean success with zero rows affected. `clearMeetingId`, right below it, runs the identical shape of update but never checks whether a row was actually affected.

> **Concretely:** if a host's session goes stale right as they leave a call, `meeting_id` can silently never clear, and the app has no way to know.

### 4. One participant leaving first can silently skip the other's cleanup
**`CallRoom.tsx:422–429`** — Ordering bug

`updateBookingStatus` and `clearMeetingId` share one try block. `updateBookingStatus` is *designed* to throw once the booking is already `completed` — which is exactly the state it's in if the other participant left first. That throw jumps straight to the catch, so the very next line — the host's `clearMeetingId` — never runs.

> **Concretely:** if the learner leaves the call before the mentor, the mentor's own meeting-cleanup step silently never executes, purely because of who happened to click Leave first.

---

## Design gaps

_Not crashes — things the flow doesn't handle, or handles asymmetrically._

### 5. No timezone anchoring anywhere in session-expiry math
**`bookingSession.ts:20,24,35`** — Robustness

`isBookingSessionPast` builds dates via `new Date(\`${date}T${startTime}\`)` — no timezone suffix, so JS parses it as the browser's local time. This function alone decides whether the Join button shows, whether a reschedule offer appears, and whether a booking reads as "Expired" in history.

> **Concretely:** correct only when a user's device timezone happens to match whatever timezone the slot data was authored in — silently wrong for anyone else.

### 6. Learner no-shows have no equivalent path to mentor no-shows
**`useCallSetup.ts:88–95` · `rescheduleApi.ts:51`** — Asymmetric

The session-expiry check that offers a reschedule only runs when `!isHost` — it's exclusively the learner watching for the mentor to not show up. There's no symmetric check, no `"learner_noshow"` reason, and no host-side path at all.

> **Concretely:** if a learner simply never joins, the booking has no automatic way out — it just sits `confirmed` indefinitely.

### 7. The reschedule deadline is shown but never enforced
**`rescheduleApi.ts:54–63` · `mentor/reschedule/[bookingId]/page.tsx:180–184`** — Decorative

`reschedule_deadline` is set 7 days out and shown to the mentor as "Propose by {date}", but nothing in the client checks it against the current time.

> **Concretely:** a mentor can propose a new slot after the stated deadline with zero friction, and if they never propose at all, nothing automatically resolves the booking either way.

### 8. A mentor is never notified when their proposal is answered
**`rescheduleApi.ts:157–182`** — Silent gap

`notify-reschedule` fires on the two outgoing events — a reschedule being requested, and a mentor proposing a slot — but neither `acceptProposal` nor `declineProposal` calls it.

> **Concretely:** a mentor who proposes a new time has no way to find out the learner responded short of manually checking back in the app.

### 9. No time-window check on starting a session
**`useCallSetup.ts:97–110`** — Missing guardrail

`startSession` lets the host create the room at any time relative to the booked slot — no early/late guard, unlike the expiry check that exists for the learner's side of the same window.

---

## Worth confirming with the team

_Can't be verified from this repo alone — likely handled outside it, but worth asking._

### 10. "48 hours to accept or decline" isn't set anywhere in the client
**`rescheduleApi.ts:102–114`** — Assumption

`proposeSlot`'s insert never sets `expires_at` — the "48 hours" copy shown to the mentor is trusting an assumed database column default that isn't visible from this repo. Worth confirming that default actually exists and is actually 48 hours.

### 11. The "rejected" status has no client-side writer
**`bookingApi.ts:253` · `BookingListItem.tsx:24`** — Assumption

`"rejected"` is read and displayed in history views and status labels, but no code in this repo ever writes it — presumably a server-side or mobile-only path. Worth confirming it's still a reachable state and not dead.

---

## Already solid

_Worth keeping as-is — flagged so it doesn't get "fixed" by accident._

### Wallet crediting can't double-fire, even from a duplicate call
**`supabase/migrations/20260817000000_fix_complete_session_payment_participant_check.sql`**

`complete_session_payment` checks for a `pending` earnings row before crediting and no-ops otherwise — a genuinely idempotent guard, not just a client-side hope.

### The completion guard is atomic, not a client-side race
**`bookingApi.ts:141–149`**

`.eq("id", bookingId).neq("status", status)` is a single SQL statement's WHERE clause, not a check-then-write in application code — Postgres row locking means two concurrent completion attempts genuinely cannot both succeed.

---

_Read-only review — no source files were modified. File:line references point at the state of the branch at time of review._
