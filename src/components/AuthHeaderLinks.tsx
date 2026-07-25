"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/routes";

export function AuthHeaderLinks() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm font-semibold">
        <Link href={ROUTES.login} className="text-text-secondary hover:text-text-primary">
          Sign in
        </Link>
        <Link
          href={ROUTES.signup}
          className="rounded-full px-4 py-1.5 text-text-on-accent"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <NotificationBell />
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
        {profile?.name || user.email}
      </Link>
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
