import { ChevronRight, Grid3x3, Heart, Play, PlayCircle, Search, ShieldCheck, Star, User, Users, Video } from "lucide-react";
import Link from "next/link";

import { AuthHeaderLinks } from "@/components/AuthHeaderLinks";
import { HomeSearchBar } from "@/components/HomeSearchBar";
import { LanguageMenu } from "@/components/LanguageMenu";
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
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: ROUTES.login, label: "Become a Creator" },
];

function formatCount(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 100) / 10}K+`;
  return `${n}`;
}

export function MarketingHome({
  trending,
  spotlight,
  stats,
}: {
  trending: MentorProfileRow[];
  spotlight: MentorProfileRow[];
  stats: PlatformStats;
}) {

  return (
    <main className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border-light bg-surface-page/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href={ROUTES.home} className="shrink-0 text-xl font-extrabold text-accent-link">
            Connectiqo
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-text-secondary xl:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="shrink-0 whitespace-nowrap hover:text-text-primary">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap sm:gap-3">
            <Link
              href={ROUTES.discover}
              aria-label="Search"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-chip hover:text-text-primary"
            >
              <Search size={17} />
            </Link>
            <LanguageMenu />
            <AuthHeaderLinks />
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-5">
          <span className="w-fit rounded-full border border-accent-link/30 bg-accent-link/10 px-3.5 py-1.5 text-xs font-semibold text-accent-link">
            Connect · Learn · Grow · Earn
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-5xl">
            Connect with <span className="text-accent-link">Connectiqo</span>
          </h1>
          <p className="max-w-lg text-lg text-text-secondary">
            Join 1-on-1 video sessions with your favorite creators, mentors &amp; experts. Build
            real connections and grow together.
          </p>
          <HomeSearchBar />
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-xs font-medium text-text-muted">
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
        <div className="flex flex-wrap gap-3">
          {HOME_CATEGORIES.map((category) => {
            const Icon = getCategoryIcon(category);
            return (
              <Link
                key={category}
                href={ROUTES.category(category)}
                className="flex items-center gap-2 rounded-xl border border-border-light bg-surface-panel px-4 py-3 text-sm font-semibold text-text-secondary transition-colors hover:border-accent-link/40 hover:text-text-primary"
              >
                <Icon size={16} className="text-accent-link" />
                {category}
              </Link>
            );
          })}
          <Link
            href={ROUTES.discover}
            className="flex items-center gap-2 rounded-xl border border-border-light bg-surface-chip px-4 py-3 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
          >
            <Grid3x3 size={16} />
            View All
          </Link>
        </div>
      </section>

      {trending.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Trending Creators 🔥</h2>
              <p className="mt-1 text-sm text-text-secondary">Top creators loved by our community</p>
            </div>
            <Link
              href={ROUTES.discover}
              className="flex items-center gap-1 text-sm font-semibold text-accent-link hover:text-accent-link-hover"
            >
              View All Creators
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((mentor) => {
              const name = mentor.profiles?.name || "Mentor";
              const avatarUrl = mentor.profiles?.avatar_url;
              return (
                <Link
                  key={mentor.id}
                  href={ROUTES.mentorProfile(mentor.id)}
                  className="group flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4 transition-all hover:border-accent-link hover:shadow-lg"
                >
                  {/* Image */}
                  <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-surface-chip to-surface-panel">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <User size={40} className="text-text-muted" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-2.5">
                    <div>
                      <div className="flex items-center gap-1">
                        <h3 className="truncate font-bold text-text-primary">{name}</h3>
                        {mentor.rating && mentor.rating >= 4.5 && (
                          <span className="text-sm">✓</span>
                        )}
                      </div>
                      <p className="truncate text-xs text-text-muted">
                        {mentor.specialization || "Mentor"}
                      </p>
                    </div>

                    {/* Rating & Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-accent-secondary text-accent-secondary" />
                        <span className="text-xs font-semibold text-text-primary">
                          {mentor.rating?.toFixed(1) || "0"}
                        </span>
                      </div>
                      {mentor.price_per_hour && (
                        <span className="text-xs font-semibold text-accent-secondary">
                          ₹{mentor.price_per_hour}/hr
                        </span>
                      )}
                    </div>

                    {/* Book Now Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="w-full rounded-lg bg-accent-primary px-3 py-2.5 text-xs font-semibold text-white hover:bg-accent-primary-hover transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section id="how-it-works" className="mx-auto w-full max-w-6xl px-6 py-10">
        <h2 className="mb-6 text-xl font-extrabold text-text-primary">How It Works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "Discover a mentor", desc: "Browse creators by category or search for a specific expert." },
            { title: "Book a live session", desc: "Pick an open slot and pay securely through Razorpay." },
            { title: "Connect 1-on-1", desc: "Join a live video call, or unlock a mentor's video library." },
          ].map((step, i) => (
            <div key={step.title} className="rounded-2xl border border-border-light bg-surface-panel p-5">
              <span className="text-xs font-bold text-accent-link">STEP {i + 1}</span>
              <h3 className="mt-1.5 text-sm font-bold text-text-primary">{step.title}</h3>
              <p className="mt-1 text-sm text-text-secondary">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-10">
        <h2 className="mb-2 text-xl font-extrabold text-text-primary">Pricing</h2>
        <p className="max-w-2xl text-sm text-text-secondary">
          Connectiqo doesn&apos;t charge subscription fees. Every mentor sets their own hourly
          rate and video-library unlock price — you only pay for the sessions or content you
          book.
        </p>
      </section>

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
