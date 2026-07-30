"use client";

import { ChevronRight, Grid3x3, Heart, Play, PlayCircle, Search, ShieldCheck, Star, User, Users, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AuthHeaderLinks } from "@/components/AuthHeaderLinks";
import { HomeSearchBar } from "@/components/HomeSearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MentorCard } from "@/components/mentor/MentorCard";
import type { MentorProfileRow, PlatformStats } from "@/lib/api/mentorApi";
import type { Testimonial } from "@/lib/api/testimonialApi";
import { ROUTES } from "@/lib/routes";
import { getCategoryIcon } from "@/lib/utils/categoryIcons";

const HOME_CATEGORIES = [
  "Business",
  "Finance & Investing",
  "AI & Machine Learning",
  "Health & Wellness",
  "Education & Coaching",
  "Content Creation",
  "Personal Development",
] as const;

const NAV_LINKS = [
  { href: ROUTES.home, label: "Home" },
  { href: ROUTES.discover, label: "Discover Creators" },
  { href: "#categories", label: "Categories" },
  { href: ROUTES.login, label: "Become a Creator" },
];

function TrendingCreatorsCarousel({
  trending,
}: {
  trending: MentorProfileRow[];
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      scroll(diff > 0 ? "right" : "left");
    }
    setTouchStart(null);
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
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Trending Creators 🔥</h2>
          <p className="mt-1 text-xs sm:text-sm text-text-secondary">Top creators loved by our community</p>
        </div>
        <Link
          href={ROUTES.discover}
          className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-accent-link hover:text-accent-link-hover"
        >
          View All
          <ChevronRight size={14} className="sm:hidden" />
          <ChevronRight size={16} className="hidden sm:block" />
        </Link>
      </div>

      <div className="relative">
        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto scroll-smooth pb-2 [-webkit-scrollbar:none] scrollbar-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {trending.map((mentor) => {
            const name = mentor.profiles?.name || "Mentor";
            const avatarUrl = mentor.profiles?.avatar_url;
            const reviewCount = mentor.total_sessions || 0;

            return (
              <Link
                key={mentor.id}
                href={ROUTES.mentorProfile(mentor.id)}
                className="group flex flex-col sm:flex-row gap-4 sm:gap-5 w-[20rem] sm:w-[28rem] shrink-0 rounded-xl border border-border-light bg-surface-panel p-4 sm:p-5 transition-all hover:border-accent-link hover:shadow-lg"
              >
                {/* Avatar - Left Side */}
                <div className="shrink-0">
                  <div className="flex h-28 w-28 sm:h-40 sm:w-40 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-surface-chip to-surface-panel">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <User size={24} className="sm:size-10 text-text-muted" />
                    )}
                  </div>
                </div>

                {/* Content - Right Side */}
                <div className="flex flex-1 flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="truncate font-bold text-text-primary text-sm sm:text-base">{name}</p>
                      {mentor.rating && mentor.rating >= 4.5 && (
                        <span className="text-sm sm:text-base">✓</span>
                      )}
                    </div>
                    <p className="truncate text-xs sm:text-sm text-text-muted">
                      {mentor.specialization || "Mentor"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Star size={14} className="sm:size-4 fill-accent-secondary text-accent-secondary" />
                    <span className="text-xs sm:text-sm font-semibold text-text-primary">
                      {mentor.rating?.toFixed(1) || "0"}
                    </span>
                    <span className="text-xs sm:text-sm text-text-muted">
                      ({(reviewCount / 1000).toFixed(1)}k)
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {mentor.price_per_hour && (
                      <span className="text-xs sm:text-base font-bold text-accent-secondary">
                        ₹{mentor.price_per_hour}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="shrink-0 rounded-md bg-accent-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-accent-primary-hover transition-colors whitespace-nowrap"
                    >
                      Book
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Scroll Buttons */}
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
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 100) / 10}K+`;
  return `${n}`;
}

export function MarketingHome({
  trending,
  stats,
}: {
  trending: MentorProfileRow[];
  stats: PlatformStats;
}) {

  return (
    <main className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border-light bg-surface-page/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4">
          <Link href={ROUTES.home} className="shrink-0 text-lg sm:text-xl font-extrabold text-accent-link">
            Connectiqo
          </Link>
          <nav className="hidden items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-text-secondary xl:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="shrink-0 whitespace-nowrap hover:text-text-primary">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3 whitespace-nowrap">
            <Link
              href={ROUTES.discover}
              aria-label="Search"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-chip hover:text-text-primary"
            >
              <Search size={16} />
            </Link>
            <AuthHeaderLinks />
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-8 sm:gap-10 px-4 sm:px-6 py-12 sm:py-16 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-4 sm:gap-5">
          <span className="w-fit rounded-full border border-accent-link/30 bg-accent-link/10 px-3 sm:px-3.5 py-1 sm:py-1.5 text-xs font-semibold text-accent-link">
            Connect · Learn · Grow · Earn
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
            <span className="text-text-primary">Connect with</span> <span className="text-accent-primary">Connectiqo</span>
          </h1>
          <p className="max-w-lg text-base sm:text-lg text-text-secondary">
            Join 1-on-1 video sessions with your favorite creators, mentors &amp; experts. Build
            real connections and grow together.
          </p>
          <HomeSearchBar />
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={ROUTES.login}
              className="flex items-center justify-center px-6 sm:px-8 py-3 bg-white/20 text-white font-extrabold rounded-full hover:bg-white/30 transition-colors border border-white/50 backdrop-blur"
            >
              Login
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-x-6 sm:gap-y-2 pt-2 text-xs font-medium text-text-muted">

            <span className="flex items-center gap-1.5">
              <Video size={14} className="text-accent-link" /> 1-on-1 Video Calls
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-accent-link" /> Trusted Creators
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-accent-link" /> Secure &amp; Safe
            </span>
            <span className="flex items-center gap-1.5">
              <PlayCircle size={14} className="text-accent-link" /> Easy Booking
            </span>
          </div>
        </div>

        {/* Video Testimonial Card */}
        <div className="relative">
          <div className="group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-3xl bg-black shadow-2xl">
            <video
              src="/videos/testimonial-1.mp4"
              poster="/videos/testimonial-1.jpg"
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

            {/* Play Button */}
            <button
              type="button"
              className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-accent-link transition-transform hover:scale-110"
              aria-label="Play testimonial"
              onClick={(e) => {
                e.preventDefault();
                const video = (e.currentTarget.parentElement as HTMLElement)?.querySelector('video') as HTMLVideoElement;
                if (video) video.play();
              }}
            >
              <Play size={28} className="ml-1 fill-current" />
            </button>

            {/* Like Button */}
            <button
              type="button"
              className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-red-500 transition-transform hover:scale-110"
              aria-label="Like"
            >
              <Heart size={20} className="fill-current" />
            </button>

            {/* Stats Badge */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2.5 rounded-2xl bg-white/95 px-3.5 py-2.5 backdrop-blur z-10">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full border-2 border-white bg-accent-link/20 flex items-center justify-center"
                  >
                    <Users size={11} className="text-accent-link" />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary">
                  59+ Happy Users
                </p>
                <p className="text-[10px] text-text-muted">Successful Connections Made</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {HOME_CATEGORIES.map((category) => {
            const Icon = getCategoryIcon(category);
            return (
              <Link
                key={category}
                href={ROUTES.category(category)}
                className="flex flex-col items-center justify-center gap-3 w-32 shrink-0 rounded-xl border border-border-light bg-surface-panel p-4 text-center transition-all hover:border-accent-link hover:shadow-md"
              >
                <Icon size={28} className="text-accent-link" />
                <span className="text-xs font-semibold text-text-secondary line-clamp-2">
                  {category}
                </span>
              </Link>
            );
          })}
          <Link
            href={ROUTES.discover}
            className="flex flex-col items-center justify-center gap-3 w-24 shrink-0 rounded-xl border border-border-light bg-surface-chip p-4 text-center transition-all hover:border-accent-link hover:shadow-md"
          >
            <Grid3x3 size={28} className="text-accent-link" />
            <span className="text-xs font-semibold text-text-secondary">View All</span>
          </Link>
        </div>
      </section>

      {trending.length > 0 ? (
        <TrendingCreatorsCarousel trending={trending} />
      ) : null}


      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div
          className="grid grid-cols-2 gap-4 rounded-2xl px-6 py-8 text-white sm:grid-cols-4"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          <div className="flex items-center gap-2.5">
            <Users size={22} />
            <div>
              <p className="text-lg font-extrabold">{formatCount(stats.mentorCount)}</p>
              <p className="text-xs opacity-80">Active Creators</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Video size={22} />
            <div>
              <p className="text-lg font-extrabold">{formatCount(stats.sessionCount)}</p>
              <p className="text-xs opacity-80">Sessions Booked</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={22} />
            <div>
              <p className="text-lg font-extrabold">{formatCount(stats.userCount)}</p>
              <p className="text-xs opacity-80">Happy Users</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Star size={22} className="fill-current" />
            <div>
              <p className="text-lg font-extrabold">{stats.averageRating.toFixed(1)}/5</p>
              <p className="text-xs opacity-80">Average Rating</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
