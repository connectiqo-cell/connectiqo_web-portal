"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import { useNotifications } from "@/contexts/NotificationContext";
import { ROUTES } from "@/lib/routes";

export function NotificationBell() {
  const { unreadCount } = useNotifications();

  return (
    <Link
      href={ROUTES.notifications}
      className="relative flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:text-text-primary"
      aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
    >
      <Bell size={18} />
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-error px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
