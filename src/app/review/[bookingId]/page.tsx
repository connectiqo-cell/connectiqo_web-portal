"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { bookingApi, type BookingRow } from "@/lib/api/bookingApi";
import { reviewsApi } from "@/lib/api/reviewsApi";
import { ROUTES } from "@/lib/routes";

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default function ReviewPage({ params }: PageProps) {
  const { bookingId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.review(bookingId))}`);
    }
  }, [authLoading, user, router, bookingId]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [bookingRow, existingReview] = await Promise.all([
          bookingApi.getBooking(bookingId),
          reviewsApi.getReviewForBooking(bookingId),
        ]);
        if (cancelled) return;
        setBooking(bookingRow);
        if (existingReview) setAlreadyReviewed(true);
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load this session");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId, user]);

  const handleSubmit = async () => {
    if (!user || !booking || rating === 0) return;
    setSubmitting(true);
    setError("");
    try {
      await reviewsApi.submitReview({
        bookingId,
        mentorId: booking.mentor_id,
        learnerId: user.id,
        rating,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError((err as Error)?.message || "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading || !user) {
    return <main className="px-6 py-16 text-center text-sm text-text-muted">Loading…</main>;
  }

  if (error && !booking) {
    return <main className="px-6 py-16 text-center text-sm text-accent-error">{error}</main>;
  }

  if (booking && user.id !== booking.learner_id) {
    return (
      <main className="px-6 py-16 text-center text-sm text-text-secondary">
        Only the learner who booked this session can leave a review.
      </main>
    );
  }

  if (booking && booking.status !== "completed") {
    return (
      <main className="px-6 py-16 text-center text-sm text-text-secondary">
        You can review this session once it&apos;s completed.
      </main>
    );
  }

  if (submitted || alreadyReviewed) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <Star size={32} className="fill-accent-primary text-accent-primary" />
        <h1 className="text-xl font-bold text-text-primary">
          {submitted ? "Thanks for your review!" : "You already reviewed this session."}
        </h1>
      </main>
    );
  }

  const mentorName = booking?.profiles?.name || "your mentor";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">Rate your session</h1>
        <p className="mt-1 text-sm text-text-secondary">How was your session with {mentorName}?</p>
      </div>

      <div className="flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              size={32}
              className={
                n <= (hoverRating || rating)
                  ? "fill-accent-primary text-accent-primary"
                  : "text-border-default"
              }
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        placeholder="Share more about your experience (optional)"
        className="rounded-xl border border-border-light bg-surface-sheet px-3.5 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
      />

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        className="flex h-12 items-center justify-center rounded-full text-sm font-semibold text-text-on-accent disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundImage: "var(--gradient-button-primary)" }}
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </main>
  );
}
