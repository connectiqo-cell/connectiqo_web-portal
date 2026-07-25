import { Award, Clock, Star, User, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportUserModal } from "@/components/ReportUserModal";
import { ReviewCard } from "@/components/mentor/ReviewCard";
import { mentorApi } from "@/lib/api/mentorApi";
import { reviewsApi } from "@/lib/api/reviewsApi";
import { parseMentorCategories } from "@/lib/utils/mentorCategories";
import { ROUTES } from "@/lib/routes";
import { createPublicClient } from "@/lib/supabase/publicClient";

interface PageProps {
  params: Promise<{ mentorId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { mentorId } = await params;
  const supabase = createPublicClient();
  const mentor = await mentorApi.getMentorWithProfile(supabase, mentorId).catch(() => null);
  if (!mentor) return { title: "Mentor — Connectiqo" };

  const name = mentor.profiles?.name || "Mentor";
  return {
    title: `${name} — ${mentor.specialization || "Mentor"} | Connectiqo`,
    description: mentor.bio || `Book a live 1-on-1 session with ${name} on Connectiqo.`,
  };
}

export const revalidate = 120;

export default async function MentorProfilePage({ params }: PageProps) {
  const { mentorId } = await params;
  const supabase = createPublicClient();

  const mentor = await mentorApi.getMentorWithProfile(supabase, mentorId).catch(() => null);
  if (!mentor) notFound();

  const reviews = await reviewsApi.getReviewsForMentor(supabase, mentorId).catch(() => []);
  const categories = parseMentorCategories(mentor.category);
  const name = mentor.profiles?.name || "Mentor";
  const avatarUrl = mentor.profiles?.avatar_url;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-panel">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
            <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <User size={40} className="text-text-muted" />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <h1 className="text-2xl font-bold text-text-primary">{name}</h1>
          <p className="text-text-secondary">{mentor.specialization || "Mentor"}</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <Link
                key={c}
                href={ROUTES.category(c)}
                className="rounded-full border border-border-light bg-surface-chip px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary"
              >
                {c}
              </Link>
            ))}
          </div>
          <ReportUserModal reportedUserId={mentorId} contextType="profile" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Star} label="Rating" value={(mentor.rating ?? 0).toFixed(1)} />
        <StatTile icon={Users} label="Sessions" value={String(mentor.total_sessions ?? 0)} />
        <StatTile icon={Award} label="Experience" value={`${mentor.experience_years ?? 0} yrs`} />
        <StatTile
          icon={Clock}
          label="Rate"
          value={mentor.price_per_hour ? `₹${mentor.price_per_hour}/hr` : "—"}
        />
      </div>

      {mentor.bio ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">About</h2>
          <p className="whitespace-pre-line leading-relaxed text-text-secondary">{mentor.bio}</p>
        </div>
      ) : null}

      <Link
        href={ROUTES.booking(mentorId)}
        className="flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold text-text-on-accent sm:w-64"
        style={{ backgroundImage: "var(--gradient-button-primary)" }}
      >
        Book a session
      </Link>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Reviews ({reviews.length})
          </h2>
          {reviews.length > 0 ? (
            <Link
              href={ROUTES.mentorReviews(mentorId)}
              className="text-xs font-semibold text-accent-link"
            >
              See all
            </Link>
          ) : null}
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-text-muted">No reviews yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.slice(0, 3).map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border-light bg-surface-panel py-3">
      <Icon size={16} className="text-accent-link" />
      <span className="text-sm font-bold text-text-primary">{value}</span>
      <span className="text-[11px] text-text-muted">{label}</span>
    </div>
  );
}
