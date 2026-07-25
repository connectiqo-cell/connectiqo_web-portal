import { Compass } from "lucide-react";
import Link from "next/link";

import { AuthHeaderLinks } from "@/components/AuthHeaderLinks";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MENTOR_CATEGORIES } from "@/lib/constants/mentorCategories";
import { ROUTES } from "@/lib/routes";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold uppercase tracking-wide text-accent-secondary">
          Connectiqo · Web
        </span>
        <div className="flex items-center gap-4">
          <AuthHeaderLinks />
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary">
          1-on-1 Live Mentorship
        </h1>
        <p className="max-w-xl text-lg text-text-secondary">
          Sign up, browse expert mentors by category, and check out a mentor&apos;s profile and
          reviews — all backed by the same Supabase project as the mobile app. Booking and live
          video calling land in the next phase.
        </p>
        <Link
          href={ROUTES.discover}
          className="flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-text-on-accent"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          <Compass size={16} />
          Discover mentors
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Browse by category
        </h2>
        <div className="flex flex-wrap gap-2">
          {MENTOR_CATEGORIES.map((category) => (
            <Link
              key={category}
              href={ROUTES.category(category)}
              className="rounded-full border border-border-light bg-surface-panel px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
