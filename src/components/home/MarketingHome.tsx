"use client";

import { ChevronLeft, ChevronRight, Grid3x3, Heart, PlayCircle, ShieldCheck, Star, User, Users, Video, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import OptimizedImage from "@/components/OptimizedImage";
import { useEffect, useRef, useState } from "react";

import { AuthHeaderLinks } from "@/components/AuthHeaderLinks";
import { HomeSearchBar } from "@/components/HomeSearchBar";
import { LanguageMenu } from "@/components/LanguageMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { MentorCategoryRow } from "@/lib/api/contentApi";
import { mentorSlug, type MentorProfileRow, type PlatformStats } from "@/lib/api/mentorApi";
import { ROUTES } from "@/lib/routes";
import { getCategoryIcon } from "@/lib/utils/categoryIcons";
import { useHorizontalScroll } from "@/lib/hooks/useHorizontalScroll";

const NAV_LINKS = [
  { href: ROUTES.discover, label: "Discover Creators" },
  { href: "#categories", label: "Categories" },
  { href: "#how-it-works", label: "How It Works" },
];

/** Hero-flanking mentor cards. */
const HERO_PROFILE_CARDS = [
  { label: "Music Mentor", rating: 4.9, image: "/optimized/music_mentor.webp" },
  { label: "Stock Trader", rating: 4.9, image: "/optimized/stocktrader.webp" },
  { label: "Wellness Coach", rating: 4.8, image: "/optimized/wellness_coach.webp" },
  { label: "AI Expert", rating: 4.8, image: "/optimized/ai_expert.webp" },
] as const;

function HeroProfileCard({
  label,
  rating,
  image,
}: {
  label: string;
  rating: number;
  image: string;
}) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-surface-chip shadow-md">
    <OptimizedImage src={image} alt={label} width={600} height={800} className="h-full w-full object-cover" priority />
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent p-2">
        <p className="truncate text-[11px] font-bold text-white">{label}</p>
        <p className="flex items-center gap-0.5 text-[10px] font-semibold text-white/90">
          <Star size={10} className="fill-accent-warning text-accent-warning" />
          {rating}
        </p>
      </div>
    </div>
  );
}

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
          className="flex gap-3 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory [-webkit-scrollbar:none] scrollbar-none md:grid md:grid-cols-2 md:overflow-visible md:snap-none xl:grid-cols-4"
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
                href={ROUTES.mentorProfile(mentorSlug(mentor))}
                className="group flex w-[84vw] max-w-[18rem] shrink-0 snap-start flex-col gap-3 rounded-xl border border-border-light bg-surface-panel p-3 transition-all hover:border-accent-link hover:shadow-lg sm:w-[22rem] md:w-auto md:max-w-none md:flex-row md:gap-4 md:p-4 xl:w-full"
              >
                {/* Avatar - Left Side */}
                <div className="shrink-0">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-surface-chip to-surface-panel sm:h-24 sm:w-24 md:h-28 md:w-28">
                    {avatarUrl ? (
                      <OptimizedImage
                        src={avatarUrl}
                        alt={name}
                        width={112}
                        height={112}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <User size={20} className="text-text-muted sm:size-8" />
                    )}
                  </div>
                </div>

                {/* Content - Right Side */}
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="truncate text-xs font-bold text-text-primary sm:text-sm">{name}</p>
                      {mentor.rating && mentor.rating >= 4.5 && (
                        <span className="text-xs sm:text-sm">✓</span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-text-muted sm:text-xs">
                      {mentor.specialization || "Mentor"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Star size={12} className="fill-accent-secondary text-accent-secondary sm:size-3.5" />
                    <span className="text-[11px] font-semibold text-text-primary sm:text-xs">
                      {mentor.rating?.toFixed(1) || "0"}
                    </span>
                    <span className="text-[11px] text-text-muted sm:text-xs">
                      ({(reviewCount / 1000).toFixed(1)}k)
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {mentor.price_per_hour && (
                      <span className="text-xs font-bold text-accent-secondary sm:text-sm">
                        ₹{mentor.price_per_hour}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="shrink-0 rounded-md bg-accent-primary px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-accent-primary-hover sm:px-3 sm:py-1.5 sm:text-xs"
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
        {canScrollLeft && trending.length > 0 && (
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

const DEFAULT_STATS: PlatformStats = {
  mentorCount: 0,
  sessionCount: 0,
  userCount: 0,
  averageRating: 0,
};

export function MarketingHome({
  trending = [],
  stats = DEFAULT_STATS,
  categories = [],
}: {
  trending?: MentorProfileRow[];
  stats?: PlatformStats;
  categories?: MentorCategoryRow[];
}) {
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [heroMuted, setHeroMuted] = useState(true);
  const { scrollRef: categoryScrollRef, canScrollLeft: canScrollCategoriesLeft, canScrollRight: canScrollCategoriesRight, scroll: scrollCategories } = useHorizontalScroll(
    categories,
    "[data-category-card]",
  );

  return (
    <main className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border-light bg-void/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4">
          <Link href={ROUTES.home} className="shrink-0 text-xl sm:text-2xl font-extrabold text-text-primary">
            Connect<span className="text-accent-link">iqo</span>
          </Link>
          <nav className="hidden items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-text-secondary xl:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="shrink-0 whitespace-nowrap hover:text-text-primary">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3 whitespace-nowrap">
            <LanguageMenu />
            <Link
              href={ROUTES.signup}
              className="hidden sm:flex items-center justify-center px-4 sm:px-5 py-2 text-sm font-semibold text-white bg-accent-primary rounded-full hover:bg-accent-primary-hover transition-colors"
            >
              Sign Up
            </Link>
            <AuthHeaderLinks />
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-8 sm:gap-10 px-4 sm:px-6 pt-4 pb-12 sm:pt-6 sm:pb-16 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-4 sm:gap-5">
          <span className="w-fit rounded-full border border-accent-link/30 bg-accent-link/10 px-3 sm:px-3.5 py-1 sm:py-1.5 text-xs font-semibold text-accent-link">
            Connect · Learn · Grow · Earn
          </span>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-4xl">
            Connect with
            <span className="-mt-1 block text-4xl text-accent-link sm:text-5xl">Connectiqo</span>
          </h1>
          <p className="max-w-lg text-justify text-base sm:text-lg text-text-secondary">
            Join 1-on-1 video sessions with your favorite creators, mentors &amp; experts. Build
            real connections and grow together.
          </p>
          <HomeSearchBar />
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

        <div className="mx-auto grid w-full max-w-xs grid-cols-1 items-center gap-3 sm:max-w-sm lg:max-w-none lg:grid-cols-[1fr_2.6fr_1fr]">
          {/* Left profile cards */}
          <div className="hidden flex-col gap-3 lg:flex">
            <HeroProfileCard {...HERO_PROFILE_CARDS[0]} />
            <HeroProfileCard {...HERO_PROFILE_CARDS[2]} />
          </div>

          {/* Video Testimonial Card, with peeking layers behind to suggest more videos */}
          <div className="relative">
            <div className="absolute inset-0 -rotate-6 rounded-2xl bg-surface-panel/70 shadow-lg" />
            <div className="absolute inset-0 -rotate-3 rounded-2xl bg-surface-panel/90 shadow-lg" />

            <div className="group relative flex aspect-[400/368] rotate-2 flex-col items-center justify-center overflow-hidden rounded-2xl bg-black shadow-2xl">
              <video
                ref={heroVideoRef}
                src="/videos/welcome.mp4"
                className="absolute inset-0 h-full w-full object-contain"
                autoPlay
                loop
                muted={heroMuted}
                playsInline
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

              {/* Mute Toggle */}
              <button
                type="button"
                className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-accent-link opacity-0 transition-all hover:scale-110 group-hover:opacity-100"
                aria-label={heroMuted ? "Unmute testimonial" : "Mute testimonial"}
                onClick={(e) => {
                  e.preventDefault();
                  setHeroMuted((m) => !m);
                }}
              >
                {heroMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              {/* Like Button */}
              <button
                type="button"
                className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 transition-transform hover:scale-110"
                aria-label="Like"
              >
                <Heart size={16} className="fill-current" />
              </button>

              {/* Stats Badge */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-white/95 px-2.5 py-2 backdrop-blur z-10">
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-5 w-5 rounded-full border-2 border-white bg-accent-link/20 flex items-center justify-center"
                    >
                      <Users size={9} className="text-accent-link" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-text-primary">
                    59+ Happy Users
                  </p>
                  <p className="text-[9px] text-text-muted">Successful Connections Made</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right profile cards */}
          <div className="hidden flex-col gap-3 lg:flex">
            <HeroProfileCard {...HERO_PROFILE_CARDS[1]} />
            <HeroProfileCard {...HERO_PROFILE_CARDS[3]} />
          </div>
        </div>
      </section>

      <section id="categories" className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10">
        <h2 className="mb-4 text-xl sm:text-2xl font-bold text-text-primary">Categories</h2>
        <div className="flex items-center gap-2">
          {canScrollCategoriesLeft ? (
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollCategories("left")}
              className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-light bg-surface-panel shadow-sm hover:bg-surface-chip"
            >
              <ChevronLeft className="w-4 h-4 text-text-secondary" />
            </button>
          ) : null}

          <div
            ref={categoryScrollRef}
            className="flex min-w-0 flex-1 gap-4 overflow-x-auto pb-2 scrollbar-none"
          >
            {categories.map(({ id, name, icon }) => {
              const Icon = getCategoryIcon(icon, name);
              return (
                <Link
                  key={id}
                  data-category-card
                  href={ROUTES.category(name)}
                  className="flex flex-col items-center justify-center gap-3 w-28 sm:w-32 shrink-0 rounded-xl border border-border-light bg-surface-panel p-4 text-center transition-all hover:border-accent-link hover:shadow-md"
                >
                  <Icon size={28} className="text-accent-link" />
                  <span className="text-xs font-semibold text-text-secondary line-clamp-2">
                    {name}
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

          {canScrollCategoriesRight ? (
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollCategories("right")}
              className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-light bg-surface-panel shadow-sm hover:bg-surface-chip"
            >
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </button>
          ) : null}
        </div>
      </section>

      <TrendingCreatorsCarousel trending={trending} />

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
