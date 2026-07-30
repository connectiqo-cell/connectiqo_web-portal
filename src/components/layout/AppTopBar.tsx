"use client";

import { ChevronDown, Crown, LogOut, Settings as SettingsIcon, Shield, User, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { HomeSearchBar } from "@/components/HomeSearchBar";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/routes";

export function AppTopBar() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [premiumNotice, setPremiumNotice] = useState(false);
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
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 shrink-0 items-center border-b border-border-light bg-surface-page/95 px-3 sm:px-6 backdrop-blur">
      <div className="flex w-full items-center gap-2 sm:gap-4">
        <Link href={ROUTES.home} className="flex shrink-0 items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            <Zap size={16} className="fill-current" />
          </span>
          <span className="hidden text-lg font-extrabold text-text-primary sm:block">
            Connect<span className="text-accent-link">iqo</span>
          </span>
        </Link>
        <div className="hidden max-w-sm flex-1 sm:block">
          <HomeSearchBar placeholder="Search by name, @username or skill" compact />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => {
                setPremiumNotice(true);
                setTimeout(() => setPremiumNotice(false), 2000);
              }}
              className="flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-text-on-accent"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            >
              <Crown size={12} className="sm:size-3.5" />
              <span className="hidden sm:inline">Upgrade</span>
            </button>
            {premiumNotice ? (
              <div className="absolute right-0 top-12 w-44 rounded-xl border border-border-light bg-surface-panel px-3 py-2 text-xs text-text-secondary shadow-lg">
                Premium plans are coming soon.
              </div>
            ) : null}
          </div>
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
                  // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
                  <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
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
