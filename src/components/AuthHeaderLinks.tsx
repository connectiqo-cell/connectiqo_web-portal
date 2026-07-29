"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/routes";

export function AuthHeaderLinks() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <span className="h-8 w-16 animate-pulse rounded-full bg-surface-chip" />
        <span className="h-8 w-20 animate-pulse rounded-full bg-surface-chip" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold sm:gap-3">
        <Link
          href={ROUTES.login}
          className="shrink-0 rounded-full border border-border-light px-4 py-1.5 text-text-secondary hover:border-border-default hover:text-text-primary"
        >
          Login
        </Link>
        <Link
          href={ROUTES.signup}
          className="shrink-0 rounded-full px-4 py-1.5 text-text-on-accent"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <NotificationBell />
      <Link href={ROUTES.videos} className="font-medium text-text-secondary hover:text-text-primary">
        Videos
      </Link>
      <Link href={ROUTES.recommended} className="font-medium text-text-secondary hover:text-text-primary">
        For You
      </Link>
      <Link href={ROUTES.bookings} className="font-medium text-text-secondary hover:text-text-primary">
        My Bookings
      </Link>
      <Link
        href={ROUTES.mentorProfileDashboard}
        className="font-medium text-text-secondary hover:text-text-primary"
      >
        Mentor Dashboard
      </Link>
      <Link href={ROUTES.settings} className="font-medium text-text-secondary hover:text-text-primary">
        Settings
      </Link>
      {profile?.is_admin ? (
        <Link href={ROUTES.admin} className="font-medium text-text-secondary hover:text-text-primary">
          Admin
        </Link>
      ) : null}
      <button
        type="button"
        onClick={() => signOut().then(() => router.push(ROUTES.home))}
        className="font-semibold text-accent-link"
      >
        Sign out
      </button>
    </div>
  );
}
