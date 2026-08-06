"use client";

import {
  Calendar,
  ChevronRight,
  PlayCircle,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { type BookingRow, bookingApi } from "@/lib/api/bookingApi";
import { type HomeVideoRow, fetchIntroVideo } from "@/lib/api/contentApi";
import { type MentorProfileRow } from "@/lib/api/mentorApi";
import { profileApi } from "@/lib/api/profileApi";
import { type PublicVideo, videoLibraryApi } from "@/lib/api/videoLibraryApi";
import { ROUTES } from "@/lib/routes";
import { useHorizontalScroll } from "@/lib/hooks/useHorizontalScroll";
import { isBookingSessionPast } from "@/lib/utils/bookingSession";
import { mentorHasCategory } from "@/lib/utils/mentorCategories";
import { HeroBanner } from "@/components/home/HeroBanner";
import { TopCategories } from "@/components/home/TopCategories";
import { PopularCreatorsCarousel } from "@/components/home/PopularCreatorsCarousel";

function formatSlot(booking: BookingRow): string {
  const date = booking.availability_slots?.date;
  const time = booking.availability_slots?.start_time;
  if (!date) return "Time to be confirmed";
  const [y, m, d] = date.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
  if (!time) return label;
  const [h, min] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${label}, ${hour12}:${String(min).padStart(2, "0")} ${period}`;
}

export function DashboardHome({
  trending,
}: {
  trending: MentorProfileRow[];
}) {
  const { user, profile } = useAuth();
  const isMentor = profile?.role === "mentor" || profile?.role === "both";
  const isLearner = profile?.role !== "mentor";
  const [upcoming, setUpcoming] = useState<BookingRow[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<PublicVideo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [introVideo, setIntroVideo] = useState<HomeVideoRow | null>(null);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const {
    scrollRef: videosScrollRef,
    canScrollLeft: canScrollVideosLeft,
    canScrollRight: canScrollVideosRight,
    scroll: scrollVideos,
  } = useHorizontalScroll(recommendedVideos, "[data-video]");

  const categoryMatches = selectedCategory
    ? trending.filter((creator) => mentorHasCategory(creator.category, selectedCategory))
    : trending;
  const filteredTrending = categoryMatches.length > 0 ? categoryMatches : trending;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const rows = await bookingApi.getUpcomingBookingsByLearner(user.id).catch(() => []);
      if (!cancelled) setUpcoming(rows.filter((b) => !isBookingSessionPast(b)).slice(0, 3));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [videos, learnerProfile] = await Promise.all([
        videoLibraryApi.getAllPublicVideos({ page: 0, pageSize: 20 }).catch(() => []),
        user && isLearner ? profileApi.getLearnerProfile(user.id).catch(() => null) : Promise.resolve(null),
      ]);
      if (cancelled) return;

      const interests: string[] = learnerProfile?.interests || [];
      const matches = interests.length
        ? videos.filter((v) => interests.some((i) => mentorHasCategory(v.mentor_profiles.category, i)))
        : [];
      setRecommendedVideos((matches.length ? matches : videos).slice(0, 4));
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isLearner]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const video = await fetchIntroVideo();
      if (!cancelled) setIntroVideo(video);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex w-full flex-1 flex-col gap-4 px-4 py-6 xl:gap-6 sm:px-6">
        <div className="mx-auto w-full max-w-7xl flex flex-1 flex-col xl:flex-row xl:items-start gap-4 xl:gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <HeroBanner />

            <TopCategories selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

            <PopularCreatorsCarousel creators={filteredTrending} />

            <section className="w-full">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">Recommended For You</h2>
                <Link href={ROUTES.videos} className="flex items-center gap-1 text-sm font-semibold text-accent-link">
                  View all <ChevronRight size={16} />
                </Link>
              </div>
              <div className="relative">
                <div
                  ref={videosScrollRef}
                  className="flex gap-4 overflow-hidden scroll-smooth pb-2 scrollbar-none"
                >
                  {recommendedVideos.map((video) => (
                    <Link
                      key={video.id}
                      href={ROUTES.videos}
                      data-video
                      className="group flex w-40 sm:w-48 shrink-0 flex-col gap-3 rounded-2xl overflow-hidden transition-all hover:shadow-lg"
                    >
                      <div className="relative flex h-24 sm:h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-black">
                        {video.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : null}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle size={40} className="text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-2 px-3 pb-3">
                        <p className="truncate text-xs sm:text-sm font-bold text-text-primary line-clamp-2">{video.title}</p>
                        <p className="truncate text-xs text-text-muted">{video.profiles?.name || "Creator"}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                {canScrollVideosLeft && (
                  <button
                    onClick={() => scrollVideos("left")}
                    className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 rounded-full bg-surface-panel shadow-md p-2 hover:bg-surface-chip z-10 pointer-events-auto"
                    aria-label="Scroll left"
                  >
                    <ChevronRight size={18} className="rotate-180 text-text-primary" />
                  </button>
                )}

                {canScrollVideosRight && (
                  <button
                    onClick={() => scrollVideos("right")}
                    className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 rounded-full bg-surface-panel shadow-md p-2 hover:bg-surface-chip z-10 pointer-events-auto"
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={18} className="text-text-primary" />
                  </button>
                )}
              </div>
            </section>
          </div>

          <aside className="flex w-full flex-col gap-4 xl:w-72 xl:shrink-0">
            {introVideo ? (
              <div className="rounded-2xl border border-border-light bg-surface-panel p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-link/15 text-accent-link">
                    <PlayCircle size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-text-primary">
                      {introVideo.title || "See Connectiqo in 60 sec"}
                    </p>
                    <p className="text-xs text-text-muted">{introVideo.label || "Discover · Book · Connect"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIntroVideo(true)}
                  className="flex h-10 w-full items-center justify-center rounded-xl bg-accent-link/10 text-sm font-semibold text-accent-link hover:bg-accent-link/15"
                >
                  Watch Now
                </button>
              </div>
            ) : null}

            <div className="rounded-2xl border border-border-light bg-surface-panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary">Upcoming Sessions</h3>
                <Link href={ROUTES.bookings} className="text-xs font-semibold text-accent-link">
                  View all
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-xs text-text-muted">No upcoming sessions yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {upcoming.map((booking) => (
                    <Link
                      key={booking.id}
                      href={ROUTES.mentorProfile(booking.mentor_id)}
                      className="flex items-center gap-2.5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
                        {booking.profiles?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
                          <img
                            src={booking.profiles.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Users size={14} className="text-text-muted" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-text-primary">
                          {booking.profiles?.name || "Mentor"}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-text-muted">
                          <Calendar size={10} />
                          {formatSlot(booking)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
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
                <span className="mt-1 flex w-fit items-center rounded-full bg-white px-4 py-1.5 text-xs font-bold text-accent-link">
                  Start Now
                </span>
              </Link>
            ) : null}
          </aside>
        </div>
      </div>

      {showIntroVideo && introVideo ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowIntroVideo(false)}
        >
          <div
            className="flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-text-primary">
                {introVideo.title || "See Connectiqo in 60 sec"}
              </h3>
              <button
                type="button"
                onClick={() => setShowIntroVideo(false)}
                aria-label="Close"
                className="shrink-0 text-text-muted hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <video src={introVideo.video_url} controls autoPlay className="h-full w-full" />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
