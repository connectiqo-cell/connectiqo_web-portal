"use client";

import { ChevronDown, LogOut, Menu, Settings as SettingsIcon, Shield, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import OptimizedImage from "@/components/OptimizedImage";
import { HomeSearchBar } from "@/components/HomeSearchBar";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/routes";

export function AppTopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 shrink-0 items-center border-b border-border-light bg-void/95 px-3 sm:px-6 backdrop-blur">
      <div className="flex w-full items-center gap-2 sm:gap-4">
        {onMenuClick ? (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-chip hover:text-text-primary lg:hidden"
          >
            <Menu size={20} />
          </button>
        ) : null}
        <Link href={ROUTES.home} className="flex shrink-0 items-center gap-2">
          <OptimizedImage src="/connectiqo_logo.png" alt="" width={40} height={40} className="h-10 w-10 sm:h-11 sm:w-11" />
          <span className="hidden text-lg font-extrabold text-text-primary sm:block">
            Connect<span className="text-accent-link">iqo</span>
          </span>
        </Link>
        <div className="hidden max-w-sm flex-1 sm:block">
          <HomeSearchBar placeholder="Search by name, @username or skill" compact />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <NotificationBell />
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1 sm:gap-2 rounded-full border border-border-light py-1 pl-1 pr-2 sm:pr-2.5 hover:border-border-default"
            >
              <span className="flex h-6 sm:h-7 w-6 sm:w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
                {profile?.avatar_url ? (
                  <OptimizedImage src={profile.avatar_url} alt={profile.name || "Profile"} width={28} height={28} className="h-full w-full object-cover" />
                ) : (
                  <User size={12} className="sm:size-3.5 text-text-muted" />
                )}
              </span>
              <span className="hidden flex-col items-start leading-tight sm:flex">
                <span className="text-xs font-semibold text-text-primary">{profile?.name || "Account"}</span>
                <span className="text-[10px] text-text-muted">
                  {profile?.role === "mentor" || profile?.role === "both" ? "Creator" : "Member"}
                </span>
              </span>
              <ChevronDown size={12} className="sm:size-3.5 text-text-muted" />
            </button>

            {open ? (
              <div className="absolute right-0 top-12 sm:top-11 w-44 overflow-hidden rounded-xl border border-border-light bg-surface-panel py-1 shadow-lg">
                <Link
                  href={ROUTES.settings}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-sm text-text-secondary hover:bg-surface-chip hover:text-text-primary"
                >
                  <SettingsIcon size={14} />
                  Settings
                </Link>
                {profile?.is_admin ? (
                  <Link
                    href={ROUTES.admin}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-sm text-text-secondary hover:bg-surface-chip hover:text-text-primary"
                  >
                    <Shield size={14} />
                    Admin
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    signOut().then(() => router.push(ROUTES.home));
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-accent-error hover:bg-surface-chip"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
