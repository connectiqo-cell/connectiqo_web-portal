"use client";

import { Calendar, ChevronRight, Mic, PlayCircle, ShieldCheck, Sparkles, Star, Users, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { MentorCard } from "@/components/mentor/MentorCard";
import { useAuth } from "@/contexts/AuthContext";
import { type BookingRow, bookingApi } from "@/lib/api/bookingApi";
import { type MentorProfileRow, type PlatformStats, mentorApi } from "@/lib/api/mentorApi";
import { profileApi } from "@/lib/api/profileApi";
import { MENTOR_CATEGORIES } from "@/lib/constants/mentorCategories";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { getCategoryIcon } from "@/lib/utils/categoryIcons";

const TOP_CATEGORIES = MENTOR_CATEGORIES.slice(0, 8);

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
  const [recommended, setRecommended] = useState<MentorProfileRow[]>([]);

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
    if (!user) return;
    let cancelled = false;
    (async () => {
      const learnerProfile = await profileApi.getLearnerProfile(user.id).catch(() => null);
      const interests = learnerProfile?.interests || [];
      if (!interests.length || cancelled) return;
      const supabase = createClient();
      const rows = await mentorApi.getRecommendedMentors(supabase, interests, 0, 8).catch(() => []);
      if (!cancelled) setRecommended(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const spotlightMentor = trending[0];
  const popularCreators = trending.slice(0, 8);

  return (
    <>
      <main className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8 xl:flex-row xl:items-start">
          <div className="flex flex-1 flex-col gap-8">
            {spotlightMentor ? (
              <Link
                href={ROUTES.mentorProfile(spotlightMentor.id)}
                className="relative flex min-h-[220px] flex-col justify-center gap-3 overflow-hidden rounded-2xl px-8 py-10 text-white"
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

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-text-primary">Top Categories</h3>
                <Link href={ROUTES.discover} className="text-sm font-semibold text-accent-link">
                  View all
                </Link>
              </div>
              <div className="flex flex-wrap gap-3">
                {TOP_CATEGORIES.map((category) => {
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
              </div>
            </section>

            {popularCreators.length > 0 ? (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-text-primary">Popular Creators</h3>
                  <Link
                    href={ROUTES.discover}
                    className="flex items-center gap-0.5 text-sm font-semibold text-accent-link"
                  >
                    View all
                    <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {popularCreators.map((mentor) => (
                    <MentorCard key={mentor.id} mentor={mentor} />
                  ))}
                </div>
              </section>
            ) : null}

            {recommended.length > 0 ? (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-lg font-extrabold text-text-primary">
                    <Sparkles size={17} className="text-accent-secondary" />
                    Recommended For You
                  </h3>
                  <Link
                    href={ROUTES.recommended}
                    className="flex items-center gap-0.5 text-sm font-semibold text-accent-link"
                  >
                    View all
                    <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {recommended.map((mentor) => (
                    <MentorCard key={mentor.id} mentor={mentor} />
                  ))}
                </div>
              </section>
            ) : null}
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
