"use client";

import { Calendar, ChevronRight, Mic, PlayCircle, ShieldCheck, Star, Users, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { type BookingRow, bookingApi } from "@/lib/api/bookingApi";
import { type MentorProfileRow, type PlatformStats, mentorApi } from "@/lib/api/mentorApi";
import { type PublicVideo, videoLibraryApi } from "@/lib/api/videoLibraryApi";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

function formatCount(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 100) / 10}K+`;
  return `${n}`;
}

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
  stats,
}: {
  trending: MentorProfileRow[];
  stats: PlatformStats;
}) {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<BookingRow[]>([]);
  const [popularCreators, setPopularCreators] = useState<MentorProfileRow[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<PublicVideo[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videosScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollVideosLeft, setCanScrollVideosLeft] = useState(false);
  const [canScrollVideosRight, setCanScrollVideosRight] = useState(false);


  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const rows = await bookingApi.getUpcomingBookingsByLearner(user.id).catch(() => []);
      if (!cancelled) setUpcoming(rows.slice(0, 3));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const rows = await mentorApi.getTrendingMentors(supabase, 4).catch(() => []);
      if (!cancelled) setPopularCreators(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const videos = await videoLibraryApi.getAllPublicVideos({ page: 0, pageSize: 4 }).catch(() => []);
      if (!cancelled) setRecommendedVideos(videos);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      container?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [popularCreators]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const firstCard = container.querySelector('[data-card]') as HTMLElement;
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth;
        const gap = 16;
        const scrollAmount = cardWidth + gap;
        container.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  const checkVideosScroll = () => {
    if (videosScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = videosScrollRef.current;
      setCanScrollVideosLeft(scrollLeft > 0);
      setCanScrollVideosRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkVideosScroll();
    const container = videosScrollRef.current;
    container?.addEventListener("scroll", checkVideosScroll);
    window.addEventListener("resize", checkVideosScroll);

    return () => {
      container?.removeEventListener("scroll", checkVideosScroll);
      window.removeEventListener("resize", checkVideosScroll);
    };
  }, [recommendedVideos]);

  const scrollVideos = (direction: "left" | "right") => {
    if (videosScrollRef.current) {
      const container = videosScrollRef.current;
      const firstVideo = container.querySelector('[data-video]') as HTMLElement;
      if (firstVideo) {
        const videoWidth = firstVideo.offsetWidth;
        const gap = 16;
        const scrollAmount = videoWidth + gap;
        container.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  const spotlightMentor = trending[0];

  return (
    <>
      <main className="flex flex-1 flex-col">
        <div className="flex w-full flex-1 flex-col gap-6 px-6 py-6 xl:flex-row xl:items-start xl:gap-6">
          <div className="flex flex-1 flex-col gap-6">
            {spotlightMentor ? (
              <Link
                href={ROUTES.mentorProfile(spotlightMentor.id)}
                className="relative flex min-h-[180px] flex-col justify-center gap-3 overflow-hidden rounded-2xl px-8 py-8 text-white"
                style={{ backgroundImage: "var(--gradient-button-primary)" }}
              >
                <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  1-on-1 Sessions
                </span>
                <h2 className="max-w-md text-3xl font-extrabold leading-tight">
                  Join a session with{" "}
                  <span className="text-accent-warning">
                    {spotlightMentor.profiles?.name || "our top creator"}
                  </span>
                  !
                </h2>
                <p className="max-w-md text-sm text-white/80">
                  {spotlightMentor.specialization || "Book a live 1-on-1 video session today."}
                </p>
                <span className="mt-1 flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-accent-link">
                  Connect Now
                  <ChevronRight size={16} />
                </span>
              </Link>
            ) : null}

<section className="w-full">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Popular Creators</h3>
                <Link href={ROUTES.discover} className="flex items-center gap-1 text-sm font-semibold text-accent-link">
                  View all <ChevronRight size={16} />
                </Link>
              </div>
              <div className="relative">
                <div
                  ref={scrollContainerRef}
                  className="flex gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-none"
                  onTouchStart={(e) => {
                    const touch = e.touches[0].clientX;
                    scrollContainerRef.current?.setAttribute('data-touch-start', String(touch));
                  }}
                  onTouchEnd={(e) => {
                    const start = Number(scrollContainerRef.current?.getAttribute('data-touch-start') || 0);
                    const end = e.changedTouches[0].clientX;
                    const diff = start - end;
                    if (Math.abs(diff) > 50) {
                      scroll(diff > 0 ? "right" : "left");
                    }
                  }}
                >
                  {popularCreators.map((creator) => (
                    <Link
                      key={creator.id}
                      href={ROUTES.mentorProfile(creator.id)}
                      data-card
                      className="group flex w-44 sm:w-56 shrink-0 flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-3 sm:p-4 transition-all hover:border-border-default hover:shadow-lg"
                    >
                      <div className="flex h-24 sm:h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-surface-chip to-surface-panel">
                        {creator.profiles?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={creator.profiles.avatar_url}
                            alt={creator.profiles?.name || ""}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Users size={20} className="sm:size-8 text-text-muted" />
                        )}
                      </div>

                      <div className="flex flex-1 flex-col gap-2">
                        <div>
                          <p className="truncate text-xs sm:text-sm font-bold text-text-primary">{creator.profiles?.name}</p>
                          <p className="truncate text-xs text-text-muted">
                            {creator.specialization || "Mentor"}
                          </p>
                        </div>

                        <div className="flex items-center gap-0.5">
                          <Star size={12} className="sm:size-3.5 fill-accent-secondary text-accent-secondary" />
                          <span className="text-xs font-semibold text-text-primary">
                            {creator.rating?.toFixed(1) || "0"}
                          </span>
                          <span className="text-xs text-text-muted">
                            ({((creator.total_sessions || 0) / 1000).toFixed(1)}k)
                          </span>
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-2">
                          {creator.price_per_hour && (
                            <span className="text-xs sm:text-sm font-bold text-accent-secondary">
                              ₹{creator.price_per_hour}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="shrink-0 rounded-lg bg-accent-primary px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold text-white hover:bg-accent-primary-hover transition-colors whitespace-nowrap"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md p-2 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 z-10"
            aria-label="Scroll left"
          >
            <ChevronRight size={18} className="rotate-180 text-text-primary" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md p-2 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 z-10"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} className="text-text-primary" />
          </button>
        )}
              </div>
            </section>

            <section className="w-full mt-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Recommended For You</h3>
                <Link href={ROUTES.videos} className="flex items-center gap-1 text-sm font-semibold text-accent-link">
                  View all <ChevronRight size={16} />
                </Link>
              </div>
              <div className="relative">
                <div
                  ref={videosScrollRef}
                  className="flex gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-none"
                >
                  {recommendedVideos.map((video) => (
                    <Link
                      key={video.id}
                      href={ROUTES.videos}
                      data-video
                      className="group flex w-48 sm:w-64 shrink-0 flex-col gap-3 rounded-2xl overflow-hidden transition-all hover:shadow-lg"
                    >
                      <div className="relative flex h-28 sm:h-36 w-full items-center justify-center overflow-hidden rounded-xl bg-black">
                        {video.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Video size={32} className="text-text-muted" />
                        )}
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
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md p-2 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 z-10"
            aria-label="Scroll left"
          >
            <ChevronRight size={18} className="rotate-180 text-text-primary" />
          </button>
        )}

        {canScrollVideosRight && (
          <button
            onClick={() => scrollVideos("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md p-2 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 z-10"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} className="text-text-primary" />
          </button>
        )}
              </div>
            </section>

          </div>
          <aside className="flex w-full flex-col gap-4 xl:w-72 xl:shrink-0">
            <div className="rounded-2xl border border-border-light bg-surface-panel p-4">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-link/15 text-accent-link">
                  <PlayCircle size={20} />
                </span>
                <div>
                  <p className="text-sm font-bold text-text-primary">See Connectiqo in 60 sec</p>
                  <p className="text-xs text-text-muted">Discover · Book · Connect</p>
                </div>
              </div>
              <ul className="flex flex-col gap-2.5 text-xs text-text-secondary">
                <li className="flex items-center gap-2">
                  <Video size={14} className="text-accent-link" />
                  1-on-1 sessions — personalized time with experts
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-accent-link" />
                  Verified mentors — background checked
                </li>
                <li className="flex items-center gap-2">
                  <Users size={14} className="text-accent-link" />
                  Secure payments — 100% safe &amp; secure
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border-light bg-surface-panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-bold text-text-primary">Upcoming Sessions</h4>
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

            <Link
              href={ROUTES.mentorProfileDashboard}
              className="flex flex-col gap-2 rounded-2xl p-4 text-white"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Mic size={16} />
              </span>
              <p className="text-sm font-bold">Become a Creator</p>
              <p className="text-xs text-white/80">Share your knowledge, grow your brand and earn.</p>
              <span className="mt-1 w-fit rounded-full bg-white px-4 py-1.5 text-xs font-bold text-accent-link">
                Start Now
              </span>
            </Link>

            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border-light bg-surface-panel p-4 text-center">
              <div>
                <p className="text-sm font-extrabold text-text-primary">{formatCount(stats.mentorCount)}</p>
                <p className="text-[11px] text-text-muted">Creators</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-0.5 text-sm font-extrabold text-text-primary">
                  <Star size={12} className="fill-current text-accent-warning" />
                  {stats.averageRating.toFixed(1)}
                </p>
                <p className="text-[11px] text-text-muted">Avg. Rating</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
