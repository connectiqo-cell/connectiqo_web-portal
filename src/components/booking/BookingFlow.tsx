"use client";

import { CalendarCheck, CheckCircle2, Clock, Loader2, User, Video, VideoOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { availabilityApi, type AvailabilitySlot } from "@/lib/api/availabilityApi";
import type { MentorProfileRow } from "@/lib/api/mentorApi";
import { paymentApi, type CreateOrderResponse } from "@/lib/api/paymentApi";
import { ROUTES } from "@/lib/routes";
import { areSlotsContiguous, slotDurationMinutes } from "@/lib/utils/contiguousSlots";
import { openRazorpayCheckout } from "@/lib/utils/razorpayCheckout";

type Step = "select" | "review" | "success";

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

function isSameSlot(a: AvailabilitySlot, b: AvailabilitySlot) {
  return a.id === b.id;
}

export function BookingFlow({
  mentorId,
  mentor,
}: {
  mentorId: string;
  mentor: MentorProfileRow;
}) {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<AvailabilitySlot[]>([]);
  const [selectError, setSelectError] = useState("");
  const [recordingRequested, setRecordingRequested] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<Step>("select");
  const [order, setOrder] = useState<CreateOrderResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.booking(mentorId))}`);
    }
  }, [authLoading, user, router, mentorId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await availabilityApi.getAvailabilityForMentor(mentorId).catch(() => []);
      if (cancelled) return;
      const now = new Date();
      const future = rows.filter((slot) => {
        if (slot.is_booked) return false;
        const slotEnd = new Date(`${slot.date}T${slot.end_time || slot.start_time}`);
        return slotEnd > now;
      });
      setSlots(future);
      setLoadingSlots(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [mentorId]);

  const dates = useMemo(() => {
    const unique = [...new Set(slots.map((s) => s.date))];
    return unique.sort();
  }, [slots]);

  // Defaults to the first available date until the user explicitly picks one —
  // derived during render instead of synced via effect+setState.
  const activeDate = selectedDate ?? dates[0] ?? null;

  const slotsForDate = useMemo(
    () =>
      slots
        .filter((s) => s.date === activeDate)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [slots, activeDate],
  );

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlots([]);
    setSelectError("");
  };

  const handleToggleSlot = (slot: AvailabilitySlot) => {
    setSelectError("");
    setSelectedSlots((prev) => {
      const exists = prev.some((s) => isSameSlot(s, slot));
      if (exists) {
        const next = prev.filter((s) => !isSameSlot(s, slot));
        if (!areSlotsContiguous(next)) {
          setSelectError("Remove slots from either end of your continuous block.");
          return prev;
        }
        return next;
      }
      const next = [...prev, slot].sort((a, b) => a.start_time.localeCompare(b.start_time));
      if (!areSlotsContiguous(next)) {
        setSelectError("Select continuous back-to-back slots only.");
        return prev;
      }
      return next;
    });
  };

  const totalMinutes = useMemo(
    () => selectedSlots.reduce((sum, s) => sum + slotDurationMinutes(s.start_time, s.end_time), 0),
    [selectedSlots],
  );

  const canContinue = selectedSlots.length > 0 && recordingRequested !== null;

  const handleContinue = async () => {
    if (!canContinue || !user || !selectedSlots.length) return;
    setError("");
    setSubmitting(true);
    try {
      const created = await paymentApi.createOrder({
        mentorId,
        learnerId: user.id,
        slotIds: selectedSlots.map((s) => s.id),
        message: message.trim() || undefined,
        recordingRequested: recordingRequested!,
      });
      setOrder(created);
      setStep("review");
    } catch (err) {
      setError((err as Error)?.message || "Could not start checkout. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async () => {
    if (!order || !user || !selectedSlots.length) return;
    setError("");
    setSubmitting(true);
    try {
      const result = await openRazorpayCheckout({
        keyId: order.keyId,
        amount: order.amount,
        orderId: order.orderId,
        name: "Connectiqo",
        description: `Session with ${mentor.profiles?.name || "mentor"}`,
        prefill: { name: profile?.name || undefined, email: profile?.email || user.email || undefined },
      });

      const verified = await paymentApi.verifyAndBook({
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
        mentorId,
        learnerId: user.id,
        slotIds: selectedSlots.map((s) => s.id),
        message: message.trim() || undefined,
        recordingRequested: recordingRequested!,
      });

      setBookingId(verified.bookingId);
      setStep("success");
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "PAYMENT_CANCELLED") {
        setError("Payment cancelled.");
      } else {
        setError((err as Error)?.message || "Payment failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border border-border-light bg-surface-panel py-16 text-center">
        <CheckCircle2 size={48} className="text-accent-success" />
        <h2 className="text-xl font-bold text-text-primary">Session booked!</h2>
        <p className="max-w-sm text-sm text-text-secondary">
          Your session with {mentor.profiles?.name || "your mentor"} is confirmed. You&apos;ll
          find it in your bookings.
        </p>
        <div className="flex gap-3">
          <Link
            href={ROUTES.bookings}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-text-on-accent"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            View my bookings
          </Link>
          <Link
            href={ROUTES.discover}
            className="rounded-full border border-border-light px-5 py-2.5 text-sm font-semibold text-text-secondary"
          >
            Discover more mentors
          </Link>
        </div>
        {bookingId ? <p className="text-xs text-text-muted">Booking ID: {bookingId}</p> : null}
      </div>
    );
  }

  if (step === "review" && order) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Order summary
          </h2>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">
              {order.slotCount > 1
                ? `Continuous session with ${mentor.profiles?.name} (${order.slotCount} slots, ${totalMinutes} min)`
                : `Session with ${mentor.profiles?.name}`}
            </span>
            <span className="text-text-primary">₹{order.mentorAmount.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">
              Platform fee ({order.platformFeePercent}% + {order.gstPercent}% GST)
            </span>
            <span className="text-text-primary">₹{order.convenienceFee.toFixed(0)}</span>
          </div>
          <div className="flex justify-between border-t border-border-light pt-3 text-sm font-bold">
            <span className="text-text-primary">Total</span>
            <span className="text-text-primary">₹{order.totalAmount.toFixed(0)}</span>
          </div>
        </div>

        {error ? <p className="text-sm text-accent-error">{error}</p> : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep("select")}
            disabled={submitting}
            className="rounded-full border border-border-light px-5 py-2.5 text-sm font-semibold text-text-secondary"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-text-on-accent disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? "Processing…" : `Pay ₹${order.totalAmount.toFixed(0)}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
          <CalendarCheck size={16} />
          Choose a date
        </h2>
        {loadingSlots ? (
          <p className="text-sm text-text-muted">Loading availability…</p>
        ) : dates.length === 0 ? (
          <p className="text-sm text-text-muted">
            This mentor has no open slots right now. Check back soon.
          </p>
        ) : (
          <BookingCalendar availableDates={dates} selectedDate={activeDate} onSelectDate={handleSelectDate} />
        )}
      </div>

      {activeDate ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
              <Clock size={16} />
              Choose a time
            </h2>
            {selectedSlots.length > 0 ? (
              <span className="text-xs font-medium text-accent-link">
                {selectedSlots.length > 1
                  ? `${formatTime(selectedSlots[0].start_time)} – ${formatTime(
                      selectedSlots[selectedSlots.length - 1].end_time,
                    )} · ${totalMinutes} min`
                  : `${totalMinutes} min`}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-text-muted">
            {formatDateLabel(activeDate)} · Tap multiple back-to-back slots to book one longer, continuous session.
          </p>
          <div className="flex flex-wrap gap-2">
            {slotsForDate.map((slot) => {
              const selected = selectedSlots.some((s) => isSameSlot(s, slot));
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleToggleSlot(slot)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    selected
                      ? "border-accent-link/50 bg-accent-link/15 text-accent-link"
                      : "border-border-light text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {formatTime(slot.start_time)} to {formatTime(slot.end_time)}
                </button>
              );
            })}
          </div>
          {selectError ? <p className="text-xs text-accent-error">{selectError}</p> : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Record this session?
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRecordingRequested(true)}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              recordingRequested === true
                ? "border-accent-link/50 bg-accent-link/15 text-accent-link"
                : "border-border-light text-text-secondary hover:text-text-primary"
            }`}
          >
            <Video size={16} />
            Yes, record it
          </button>
          <button
            type="button"
            onClick={() => setRecordingRequested(false)}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              recordingRequested === false
                ? "border-accent-link/50 bg-accent-link/15 text-accent-link"
                : "border-border-light text-text-secondary hover:text-text-primary"
            }`}
          >
            <VideoOff size={16} />
            No thanks
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Message to mentor (optional)
        </h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="What would you like to focus on in this session?"
          className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      <button
        type="button"
        onClick={handleContinue}
        disabled={!canContinue || submitting}
        className="flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold text-text-on-accent disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundImage: "var(--gradient-button-primary)" }}
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
        {submitting
          ? "Preparing checkout…"
          : selectedSlots.length > 1
            ? "Continue to payment (continuous session)"
            : "Continue to payment"}
      </button>
    </div>

    <aside className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4 lg:sticky lg:top-20">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
          {mentor.profiles?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
            <img
              src={mentor.profiles.avatar_url}
              alt={mentor.profiles.name || "Mentor"}
              className="h-full w-full object-cover"
            />
          ) : (
            <User size={18} className="text-text-muted" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">
            {mentor.profiles?.name || "Mentor"}
          </p>
          <p className="truncate text-xs text-text-muted">{mentor.specialization || "Mentor"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border-light pt-3 text-sm">
        <span className="text-text-secondary">Price</span>
        <span className="font-semibold text-text-primary">
          {mentor.price_per_hour ? `₹${mentor.price_per_hour} / session` : "—"}
        </span>
      </div>

      {activeDate ? (
        <div className="flex flex-col gap-1.5 border-t border-border-light pt-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Date</span>
            <span className="font-medium text-text-primary">{formatDateLabel(activeDate)}</span>
          </div>
          {selectedSlots.length > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Time</span>
              <span className="font-medium text-text-primary">
                {formatTime(selectedSlots[0].start_time)} –{" "}
                {formatTime(selectedSlots[selectedSlots.length - 1].end_time)} · {totalMinutes} min
              </span>
            </div>
          ) : (
            <p className="text-xs text-text-muted">Pick a time slot to continue.</p>
          )}
        </div>
      ) : (
        <p className="border-t border-border-light pt-3 text-xs text-text-muted">
          Pick a date to see available times.
        </p>
      )}
    </aside>
    </div>
  );
}
