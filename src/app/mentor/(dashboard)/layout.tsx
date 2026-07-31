"use client";

import { Calendar, LayoutDashboard, Wallet, Video } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/routes";

const NAV_ITEMS = [
  { href: ROUTES.mentorProfileDashboard, label: "Profile", icon: LayoutDashboard },
  { href: ROUTES.mentorSessions, label: "Sessions", icon: Calendar },
  { href: ROUTES.mentorEarnings, label: "Earnings", icon: Wallet },
  { href: ROUTES.mentorSchedule, label: "Schedule", icon: Calendar },
  { href: ROUTES.mentorVideos, label: "Videos", icon: Video },
];

const PAGE_HEADERS: Record<string, { title: string; subtitle: string }> = {
  [ROUTES.mentorProfileDashboard]: { title: "Profile", subtitle: "Manage your profile information" },
  [ROUTES.mentorSessions]: { title: "Sessions", subtitle: "Track your teaching sessions" },
  [ROUTES.mentorEarnings]: { title: "Earnings", subtitle: "Track your income and transactions" },
  [ROUTES.mentorSchedule]: { title: "Schedule", subtitle: "Manage your availability" },
  [ROUTES.mentorVideos]: { title: "Videos", subtitle: "Manage your video content" },
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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{header.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">{header.subtitle}</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-border-light">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "border-accent-link text-accent-link"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              <Icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </main>
  );
}
