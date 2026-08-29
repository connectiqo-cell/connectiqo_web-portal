import { ArrowLeft, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewCard } from "@/components/mentor/ReviewCard";
import { mentorApi } from "@/lib/api/mentorApi";
import { reviewsApi } from "@/lib/api/reviewsApi";
import { ROUTES } from "@/lib/routes";
import { createPublicClient } from "@/lib/supabase/publicClient";

interface PageProps {
  params: Promise<{ mentorId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { mentorId } = await params;
  const supabase = createPublicClient();
  const mentor = await mentorApi.getMentorWithProfile(supabase, mentorId).catch(() => null);
  const name = mentor?.profiles?.name || "Mentor";
  return { title: `Reviews for ${name} — Connectiqo` };
}

export const revalidate = 120;

export default async function MentorReviewsPage({ params }: PageProps) {
  const { mentorId: identifier } = await params;
  const supabase = createPublicClient();

  const mentor = await mentorApi.getMentorWithProfile(supabase, identifier).catch(() => null);
  if (!mentor) notFound();

  const reviews = await reviewsApi.getReviewsForMentor(supabase, mentor.id).catch(() => []);
  const name = mentor.profiles?.name || "Mentor";

  const total = reviews.length;
  const avg = total ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total : 0;
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <Link
        href={ROUTES.mentorProfile(identifier)}
        className="flex w-fit items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        {name}&apos;s profile
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Reviews for {name}</h1>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-surface-panel p-5 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex shrink-0 flex-col items-center gap-1">
          <span className="text-4xl font-extrabold text-text-primary">{avg.toFixed(1)}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={14}
                className={n <= Math.round(avg) ? "fill-accent-primary text-accent-primary" : "text-border-default"}
              />
            ))}
          </div>
          <span className="text-xs text-text-muted">{total} reviews</span>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          {breakdown.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="w-3 text-xs text-text-muted">{star}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-chip">
                <div
                  className="h-full rounded-full bg-accent-primary"
                  style={{ width: total ? `${(count / total) * 100}%` : "0%" }}
                />
              </div>
              <span className="w-5 text-right text-xs text-text-muted">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="py-12 text-center text-sm text-text-muted">No reviews yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </main>
  );
}
