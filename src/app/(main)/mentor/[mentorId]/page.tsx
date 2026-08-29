import { Award, Clock, Star, User, Users, UsersRound, Video as VideoIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import OptimizedImage from "@/components/OptimizedImage";
import { notFound } from "next/navigation";

import { ReportUserModal } from "@/components/ReportUserModal";
import { MentorProfileCta } from "@/components/mentor/MentorProfileCta";
import { MentorSocialLinks } from "@/components/mentor/MentorSocialLinks";
import { MentorVideoLibrary } from "@/components/mentor/MentorVideoLibrary";
import { ReviewCard } from "@/components/mentor/ReviewCard";
import { mentorApi } from "@/lib/api/mentorApi";
import { reviewsApi } from "@/lib/api/reviewsApi";
import { videoLibraryApi } from "@/lib/api/videoLibraryApi";
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
    description: mentor.bio?.trim() || `Book a live 1-on-1 session with ${name} on Connectiqo.`,
  };
}

export const revalidate = 120;

export default async function MentorProfilePage({ params }: PageProps) {
  const { mentorId: identifier } = await params;
  const supabase = createPublicClient();

  const mentor = await mentorApi.getMentorWithProfile(supabase, identifier).catch(() => null);
  if (!mentor) notFound();

  // Route param may be a username; every DB call below needs the real UUID.
  const mentorId = mentor.id;

  const [reviews, subscriberCount, videos] = await Promise.all([
    reviewsApi.getReviewsForMentor(supabase, mentorId).catch(() => []),
    mentorApi.getMentorActiveSubscriberCount(supabase, mentorId),
    videoLibraryApi.getMentorVideos(mentorId).catch(() => []),
  ]);
  const categories = parseMentorCategories(mentor.category);
  const name = mentor.profiles?.name || "Mentor";
  const avatarUrl = mentor.profiles?.avatar_url;
  const username = mentor.profiles?.username;
  const hasSocialLinks = Boolean(
    mentor.youtube_url || mentor.instagram_url || mentor.x_url || mentor.linkedin_url,
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div
        className="relative -mx-6 -mt-6 flex h-40 w-[calc(100%+3rem)] items-center justify-center overflow-hidden sm:-mt-12 sm:rounded-b-3xl"
        style={!mentor.cover_image_url ? { backgroundImage: "var(--gradient-button-primary)" } : undefined}
      >
          {mentor.cover_image_url ? (
          <OptimizedImage src={mentor.cover_image_url} alt="" width={1200} height={300} className="h-full w-full object-cover" />
        ) : (
          <span className="select-none text-2xl font-extrabold tracking-wide text-white/25 sm:text-3xl">
            Connect<span className="text-white/40">iqo</span>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-panel">
          {avatarUrl ? (
            <OptimizedImage src={avatarUrl} alt={name} width={112} height={112} className="h-full w-full object-cover" />
          ) : (
            <User size={40} className="text-text-muted" />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-text-primary">{name}</h1>
            <ReportUserModal reportedUserId={mentorId} contextType="profile" />
          </div>
          {username ? <p className="text-sm text-accent-link">@{username}</p> : null}
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

          {hasSocialLinks ? (
            <div className="mt-1 border-t border-border-light pt-3">
              <MentorSocialLinks mentor={mentor} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <StatTile icon={UsersRound} label="Subscribers" value={String(subscriberCount)} />
        <StatTile icon={VideoIcon} label="Videos" value={String(videos.length)} />
        <StatTile icon={Star} label="Rating" value={(mentor.rating ?? 0).toFixed(1)} />
        <StatTile icon={Users} label="Sessions" value={String(mentor.total_sessions ?? 0)} />
        <StatTile icon={Award} label="Experience" value={`${mentor.experience_years ?? 0} yrs`} />
        <StatTile
          icon={Clock}
          label="Price/session"
          value={mentor.price_per_hour ? `₹${mentor.price_per_hour}/session` : "—"}
        />
      </div>

      {mentor.bio?.trim() ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">About</h2>
          <p className="whitespace-pre-line leading-relaxed text-text-secondary">{mentor.bio}</p>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <div className="flex-1 sm:flex-none">
          <MentorProfileCta mentorId={mentorId} />
        </div>
      </div>

      <MentorVideoLibrary mentorId={mentorId} mentorName={name} unlockPrice={mentor.unlock_price ?? null} />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Reviews ({reviews.length})
          </h2>
          {reviews.length > 0 ? (
            <Link
              href={ROUTES.mentorReviews(identifier)}
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
