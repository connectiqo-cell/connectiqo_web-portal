"use client";

import {
  Bell,
  Calendar,
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  GraduationCap,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import type { Notification } from "@/lib/api/notificationApi";
import { ROUTES } from "@/lib/routes";

const ACCENT_STYLES: Record<Notification["accent"], string> = {
  gold: "bg-accent-primary/15 text-accent-primary",
  teal: "bg-accent-secondary/15 text-accent-secondary",
  error: "bg-accent-error/15 text-accent-error",
  purple: "bg-accent-link/15 text-accent-link",
  muted: "bg-surface-chip text-text-muted",
};

const STATUS_ICON: Record<string, typeof Bell> = {
  pending: Calendar,
  confirmed: CalendarCheck,
  rejected: XCircle,
  completed: CheckCircle2,
  cancelled: CalendarX,
};

function destinationFor(n: Notification): string {
  if (n.role === "learner" && n.status === "completed") return ROUTES.review(n.bookingId);
  if (n.role === "mentor") return ROUTES.mentorSessions;
  return ROUTES.bookings;
}

function timeAgo(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { notifications, loading, isRead, markAsRead, markAllRead } = useNotifications();

  useEffect(() => {
    if (!authLoading && !user) router.replace(ROUTES.login);
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!loading && notifications.length) {
      void Promise.resolve().then(() => markAllRead());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, notifications.length]);

  if (!user) return null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>

      {loading ? (
        <p className="py-8 text-center text-sm text-text-muted">Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Bell size={28} className="text-text-muted" />
          <p className="text-sm text-text-muted">No notifications yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const Icon = STATUS_ICON[n.status] || Bell;
            const RoleIcon = n.role === "mentor" ? GraduationCap : User;
            return (
              <Link
                key={n.id}
                href={destinationFor(n)}
                onClick={() => markAsRead(n.id)}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                  isRead(n.id)
                    ? "border-border-light bg-surface-panel"
                    : "border-accent-link/40 bg-accent-link/5"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ACCENT_STYLES[n.accent]}`}
                >
                  <Icon size={16} />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-text-primary">{n.title}</p>
                    <RoleIcon size={11} className="text-text-muted" />
                  </div>
                  <p className="text-sm text-text-secondary">{n.body}</p>
                  <p className="mt-1 text-xs text-text-muted">{timeAgo(n.timestamp)}</p>
                </div>
                {!isRead(n.id) ? (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-link" />
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
