import { Compass, PlayCircle } from "lucide-react";
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
          Book live 1-on-1 video sessions with expert mentors, or unlock a mentor&apos;s video
          library — all backed by the same Supabase project as the mobile app.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={ROUTES.discover}
            className="flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-text-on-accent"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            <Compass size={16} />
            Discover mentors
          </Link>
          <Link
            href={ROUTES.videos}
            className="flex w-fit items-center gap-2 rounded-full border border-border-light px-5 py-2.5 text-sm font-semibold text-text-secondary hover:text-text-primary"
          >
            <PlayCircle size={16} />
            Browse videos
          </Link>
        </div>
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
