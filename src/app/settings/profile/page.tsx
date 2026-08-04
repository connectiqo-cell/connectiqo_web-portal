"use client";

import {
  AtSign,
  Award,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Play,
  Star,
  User,
  Users,
  UsersRound,
  Video as VideoIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ReviewCard } from "@/components/mentor/ReviewCard";
import { useAuth } from "@/contexts/AuthContext";
import { type MentorProfileRow, mentorApi } from "@/lib/api/mentorApi";
import { profileApi } from "@/lib/api/profileApi";
import { type ReviewRow, reviewsApi } from "@/lib/api/reviewsApi";
import { type MentorVideo, videoLibraryApi } from "@/lib/api/videoLibraryApi";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { parseMentorCategories } from "@/lib/utils/mentorCategories";

function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function VideoDurationBadge({ src }: { src: string }) {
  const [duration, setDuration] = useState<number | null>(null);

  if (duration === null) {
    return (
      <video
        preload="metadata"
        src={`${src}#t=0.1`}
        className="hidden"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
    );
  }

  return (
    <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
      {formatSeconds(duration)}
    </span>
  );
}

export default function ProfileChannelPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const isMentor = profile?.role === "mentor" || profile?.role === "both";

  const [loading, setLoading] = useState(true);
  const [mentor, setMentor] = useState<MentorProfileRow | null>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [videos, setVideos] = useState<MentorVideo[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [learnerBio, setLearnerBio] = useState<{ bio: string | null; interests: string[] } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace(ROUTES.login);
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || !profile) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        if (isMentor) {
          const [mentorRow, subs, vids, revs] = await Promise.all([
            mentorApi.getMentorWithProfile(supabase, user.id).catch(() => null),
            mentorApi.getMentorActiveSubscriberCount(supabase, user.id).catch(() => 0),
            videoLibraryApi.getMentorVideos(user.id).catch(() => []),
            reviewsApi.getReviewsForMentor(supabase, user.id).catch(() => []),
          ]);
          if (cancelled) return;
          setMentor(mentorRow);
          setSubscriberCount(subs);
          setVideos(vids);
          setReviews(revs);
        } else {
          const learnerProfile = await profileApi.getLearnerProfile(user.id).catch(() => null);
          if (cancelled) return;
          setLearnerBio(learnerProfile);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, profile, isMentor]);

  const ratingBreakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // index 0 => 1 star ... index 4 => 5 star
    for (const r of reviews) {
      const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
      counts[idx] += 1;
    }
    const average = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    return { counts, average };
  }, [reviews]);

  const categories = mentor ? parseMentorCategories(mentor.category) : [];
  const freeVideos = useMemo(() => videos.filter((v) => v.is_free), [videos]);
  const paidVideos = useMemo(() => videos.filter((v) => !v.is_free), [videos]);
  const hasVideos = isMentor && videos.length > 0;

  const completionItems = isMentor
    ? [
        { label: "Add profile picture", done: !!profile?.avatar_url },
        { label: "Add cover photo", done: !!mentor?.cover_image_url },
        { label: "Add about you", done: !!mentor?.bio?.trim() },
        { label: "Add skills", done: (mentor?.skills?.length ?? 0) > 0 },
        {
          label: "Add social links",
          done: !!(mentor?.linkedin_url || mentor?.twitter_url || mentor?.instagram_url || mentor?.youtube_url),
        },
      ]
    : [
        { label: "Add profile picture", done: !!profile?.avatar_url },
        { label: "Add about you", done: !!learnerBio?.bio?.trim() },
        { label: "Pick your interests", done: (learnerBio?.interests?.length ?? 0) > 0 },
      ];
  const completionPct = Math.round(
    (completionItems.filter((i) => i.done).length / completionItems.length) * 100,
  );

  if (authLoading || !user || loading) {
    return <p className="px-6 py-16 text-center text-sm text-text-muted">Loading…</p>;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <div
        className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-2xl sm:h-44"
        style={{ backgroundImage: "var(--gradient-button-primary)" }}
      >
        {mentor?.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
          <img src={mentor.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="select-none text-2xl font-extrabold tracking-wide text-white/25 sm:text-3xl">
            Connect<span className="text-white/40">iqo</span>
          </span>
        )}
        {isMentor ? (
          <Link
            href={ROUTES.editProfileForm}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black/65"
          >
            <Camera size={13} />
            Edit Cover
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-4">
          <div className="relative -mt-16 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-void bg-surface-panel sm:h-28 sm:w-28">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
              <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <User size={36} className="text-text-muted" />
            )}
            <Link
              href={ROUTES.editProfileForm}
              aria-label="Change photo"
              className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent-link text-white shadow-sm hover:opacity-90"
            >
              <Camera size={12} />
            </Link>
          </div>
          <div className="flex flex-col gap-1 pb-1">
            <h1 className="text-xl font-extrabold text-text-primary sm:text-2xl">{profile?.name}</h1>
            {profile?.username ? <p className="text-sm text-accent-link">@{profile.username}</p> : null}
            <p className="text-sm text-text-secondary">{mentor?.specialization || (isMentor ? "Mentor" : "Member")}</p>
          </div>
        </div>
        <Link
          href={ROUTES.editProfileForm}
          className="flex w-fit items-center gap-1.5 rounded-full border border-border-light px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary"
        >
          <Pencil size={14} />
          Edit Profile
        </Link>
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <span
              key={c}
              className="rounded-full border border-border-light bg-surface-chip px-2.5 py-1 text-xs text-text-secondary"
            >
              {c}
            </span>
          ))}
        </div>
      ) : null}

      {isMentor ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          <StatTile icon={UsersRound} label="Subscribers" value={String(subscriberCount)} />
          <StatTile icon={VideoIcon} label="Videos" value={String(videos.length)} />
          <StatTile icon={Calendar} label="Sessions" value={String(mentor?.total_sessions ?? 0)} />
          <StatTile icon={Star} label="Rating" value={(mentor?.rating ?? 0).toFixed(1)} />
          <StatTile icon={Award} label="Experience" value={`${mentor?.experience_years ?? 0} yrs`} />
          <StatTile icon={Clock} label="Price/session" value={mentor?.price_per_hour ? `₹${mentor.price_per_hour}/session` : "—"} />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          {hasVideos ? (
            <>
              <VideoRow title="Free Videos" videos={freeVideos} />
              <VideoRow title="Members Only" videos={paidVideos} />
            </>
          ) : null}

          {isMentor ? (
            <section className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-text-primary">Reviews</h2>
                {reviews.length > 0 ? (
                  <Link
                    href={ROUTES.mentorReviews(user.id)}
                    className="text-xs font-semibold text-accent-link"
                  >
                    See all
                  </Link>
                ) : null}
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-text-muted">No reviews yet.</p>
              ) : (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex shrink-0 flex-col items-center gap-1 sm:w-28">
                      <p className="text-3xl font-extrabold text-text-primary">
                        {ratingBreakdown.average.toFixed(1)}
                      </p>
                      <div className="flex gap-0.5 text-accent-warning">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < Math.round(ratingBreakdown.average) ? "fill-current" : "text-border-default"}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-text-muted">Based on {reviews.length} reviews</p>
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingBreakdown.counts[star - 1];
                        const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs text-text-secondary">
                            <span className="w-8 shrink-0">{star} Star</span>
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-chip">
                              <span
                                className="block h-full rounded-full bg-accent-warning"
                                style={{ width: `${pct}%` }}
                              />
                            </span>
                            <span className="w-4 shrink-0 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 border-t border-border-light pt-3">
                    {reviews.slice(0, 3).map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </>
              )}
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4">
          <section className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
            <h2 className="text-sm font-bold text-text-primary">About Me</h2>
            {isMentor ? (
              mentor?.bio?.trim() ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">{mentor.bio}</p>
              ) : (
                <p className="text-sm text-text-muted">
                  You haven&apos;t added a bio yet.{" "}
                  <Link href={ROUTES.mentorProfileDashboard} className="font-semibold text-accent-link">
                    Add one
                  </Link>
                </p>
              )
            ) : learnerBio?.bio?.trim() ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">{learnerBio.bio}</p>
            ) : (
              <p className="text-sm text-text-muted">
                You haven&apos;t added a bio yet.{" "}
                <Link href={ROUTES.editProfileForm} className="font-semibold text-accent-link">
                  Add one
                </Link>
              </p>
            )}

            {isMentor && mentor?.skills && mentor.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {mentor.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-accent-link/10 px-2.5 py-1 text-xs font-medium text-accent-link"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5 border-t border-border-light pt-3 text-xs text-text-secondary">
              {isMentor && mentor?.location ? (
                <span className="flex items-center gap-2">
                  <MapPin size={13} className="shrink-0 text-text-muted" />
                  {mentor.location}
                </span>
              ) : null}
              {profile?.email ? (
                <span className="flex items-center gap-2">
                  <Mail size={13} className="shrink-0 text-text-muted" />
                  {profile.email}
                </span>
              ) : null}
              {isMentor && mentor?.website ? (
                <a
                  href={/^https?:\/\//.test(mentor.website) ? mentor.website : `https://${mentor.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-accent-link"
                >
                  <Globe size={13} className="shrink-0 text-text-muted" />
                  {mentor.website}
                </a>
              ) : null}
              {profile?.created_at ? (
                <span className="flex items-center gap-2">
                  <Calendar size={13} className="shrink-0 text-text-muted" />
                  Joined{" "}
                  {new Date(profile.created_at).toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              ) : null}
            </div>

            {isMentor && (mentor?.linkedin_url || mentor?.twitter_url || mentor?.instagram_url || mentor?.youtube_url) ? (
              <div className="flex items-center gap-2 border-t border-border-light pt-3">
                {mentor.linkedin_url ? (
                  <a
                    href={mentor.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    title="LinkedIn"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-chip text-text-secondary hover:text-text-primary"
                  >
                    <Briefcase size={14} />
                  </a>
                ) : null}
                {mentor.twitter_url ? (
                  <a
                    href={mentor.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter / X"
                    title="Twitter / X"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-chip text-text-secondary hover:text-text-primary"
                  >
                    <AtSign size={14} />
                  </a>
                ) : null}
                {mentor.instagram_url ? (
                  <a
                    href={mentor.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    title="Instagram"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-chip text-text-secondary hover:text-text-primary"
                  >
                    <Camera size={14} />
                  </a>
                ) : null}
                {mentor.youtube_url ? (
                  <a
                    href={mentor.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    title="YouTube"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-chip text-text-secondary hover:text-text-primary"
                  >
                    <VideoIcon size={14} />
                  </a>
                ) : null}
              </div>
            ) : null}
          </section>

          <div className="rounded-2xl border border-border-light bg-surface-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">Profile Completion</h3>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-link/15 text-xs font-extrabold text-accent-link">
                {completionPct}%
              </span>
            </div>
            <p className="mb-3 text-xs text-text-muted">
              {completionPct === 100
                ? "Your profile is complete."
                : completionPct >= 80
                  ? "Great job! Your profile is almost complete."
                  : "Complete your profile to help learners find and trust you."}
            </p>
            <ul className="flex flex-col gap-2">
              {completionItems.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-xs">
                  {item.done ? (
                    <CheckCircle2 size={14} className="shrink-0 text-accent-success" />
                  ) : (
                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-border-default" />
                  )}
                  <span className={item.done ? "text-text-secondary" : "text-text-muted"}>{item.label}</span>
                </li>
              ))}
            </ul>
            {!isMentor ? (
              <Link
                href={ROUTES.editProfileForm}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-accent-link"
              >
                <Camera size={13} />
                Complete your profile
              </Link>
            ) : null}
          </div>

          {!isMentor ? (
            <Link
              href={ROUTES.mentorProfileDashboard}
              className="flex flex-col gap-2 rounded-2xl p-4 text-white"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Users size={16} />
              </span>
              <p className="text-sm font-bold">Become a Creator</p>
              <p className="text-xs text-white/80">Share your knowledge, grow your brand and earn.</p>
            </Link>
          ) : null}
        </aside>
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

function VideoRow({ title, videos }: { title: string; videos: MentorVideo[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [playingVideo, setPlayingVideo] = useState<MentorVideo | null>(null);

  if (videos.length === 0) return null;

  return (
    <section className="relative flex min-w-0 flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-text-primary">{title}</h2>
        <Link href={ROUTES.mentorVideos} className="text-xs font-semibold text-accent-link">
          See all
        </Link>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scroll-smooth pb-1">
        {videos.map((video) => (
          <button
            key={video.id}
            type="button"
            onClick={() => setPlayingVideo(video)}
            className="flex w-44 shrink-0 flex-col gap-1.5 text-left"
          >
            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-meeting-canvas">
              {video.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
                <img src={video.thumbnail_url} alt={video.title} className="h-full w-full object-cover" />
              ) : null}
              <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90">
                  <Play size={16} className="ml-0.5 fill-black text-black" />
                </span>
              </span>
              {video.is_free ? (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-accent-success/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  FREE
                </span>
              ) : null}
              <VideoDurationBadge src={video.video_url} />
            </div>
            <p className="truncate text-xs font-semibold text-text-primary">{video.title}</p>
            {video.description ? (
              <p className="line-clamp-2 text-[11px] text-text-muted">{video.description}</p>
            ) : null}
            <span className="w-fit rounded-full bg-accent-link/10 px-2 py-0.5 text-[10px] font-semibold text-accent-link">
              Video
            </span>
          </button>
        ))}
      </div>
      {videos.length > 4 ? (
        <button
          type="button"
          onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
          aria-label="Scroll videos"
          className="absolute right-2 top-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-border-light bg-surface-panel text-text-secondary shadow-sm hover:text-text-primary"
        >
          <ChevronRight size={16} />
        </button>
      ) : null}

      {playingVideo ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPlayingVideo(null)}
        >
          <div
            className="flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="truncate text-sm font-semibold text-text-primary">{playingVideo.title}</h3>
              <button
                type="button"
                onClick={() => setPlayingVideo(null)}
                aria-label="Close"
                className="shrink-0 text-text-muted hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <video
                src={playingVideo.video_url}
                controls
                autoPlay
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
