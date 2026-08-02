"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/routes";

const PAGE_HEADERS: Record<string, { title: string; subtitle: string }> = {
  [ROUTES.mentorSessions]: { title: "Sessions", subtitle: "Track your teaching sessions" },
  [ROUTES.mentorAvailability]: { title: "Availability", subtitle: "Manage when you're free for sessions" },
  [ROUTES.mentorProfileDashboard]: { title: "Profile", subtitle: "Manage your public mentor profile" },
  [ROUTES.mentorSchedule]: { title: "Schedule", subtitle: "Set your available time slots" },
  [ROUTES.mentorVideos]: { title: "Videos", subtitle: "Manage your video library" },
};

export default function MentorDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`${ROUTES.login}?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (!user) return null;

  const header = PAGE_HEADERS[pathname] || PAGE_HEADERS[ROUTES.mentorProfileDashboard];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{header.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">{header.subtitle}</p>
      </div>

      {children}
    </main>
  );
}
